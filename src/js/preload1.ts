import { contextBridge, ipcRenderer } from 'electron';
// import { ChatGptStreamStatus } from './lib/ptp/protobuf/PTPCommon/types';

declare global {
  interface Window {
    socket: WebSocket;
    WaiApi: {
      sendWebSocketMessage: (message: string) => void;
    };
  }
}

class OpenAiStream {
  static text: string = '';
  static lastText: string = '';
  static cache: Record<string, boolean> = {};
  static chatId: string;
  static loading: boolean;
  static msgId: number;

  static handleMsgReply(message: string) {
    const v = message;
    if (v.startsWith('[REQUEST]')) {
      const options: any = JSON.parse(v.replace('[REQUEST] ', '').trim());
      const body = JSON.parse(options.body);
      console.log('[REQUEST]', body.messages[0].content.parts[0], body);
      return;
    }

    if (v.startsWith('[ERROR]')) {
      OpenAiStream.loading = false;
      console.log('[ERROR]', v);
      ipcRenderer.send('onMainMessage', {
        action: 'onRecvAiMsg',
        payload: {
          reply: v,
          msgId: OpenAiStream.msgId,
          chatId: OpenAiStream.chatId,
          // streamStatus: ChatGptStreamStatus.ChatGptStreamStatus_ERROR,
        },
      });
      return;
    }
    if (v === '[START]') {
      ipcRenderer.send('onMainMessage', {
        action: 'onRecvAiMsg',
        payload: {
          reply: '',
          msgId: OpenAiStream.msgId,
          chatId: OpenAiStream.chatId,
          // streamStatus: ChatGptStreamStatus.ChatGptStreamStatus_START,
        },
      });
      return;
    }
    OpenAiStream.text += v;
    if (OpenAiStream.text.startsWith('data:')) {
      let lines = OpenAiStream.text
        .substring(5)
        .split('data:')
        .filter(row => row !== '')
        .map(row => row.trim());
      if (lines && lines.length > 0) {
        lines.forEach((line, i) => {
          if (line.indexOf('{') === 0 && line.substring(line.length - 1) === '}') {
            try {
              const part = JSON.parse(line).message.content.parts[0];
              if (!OpenAiStream.cache[part]) {
                OpenAiStream.cache[part] = true;
                const msgText = part.replace(OpenAiStream.lastText, '');
                ipcRenderer.send('onMainMessage', {
                  action: 'onRecvAiMsg',
                  payload: {
                    reply: msgText,
                    msgId: OpenAiStream.msgId,
                    chatId: OpenAiStream.chatId,
                    // streamStatus: ChatGptStreamStatus.ChatGptStreamStatus_GOING,
                  },
                });
                OpenAiStream.lastText = part;
              }
            } catch (e) {}
          } else {
            if (line === '[DONE]') {
              OpenAiStream.loading = false;
              const msgLine = lines[i - 1];
              const msg = JSON.parse(msgLine.trim());
              const msgText = msg.message.content.parts[0];
              console.log('[DONE]', msgText, msg);
              ipcRenderer.send('onMainMessage', {
                action: 'onRecvAiMsg',
                payload: {
                  reply: msgText,
                  msgId: OpenAiStream.msgId,
                  chatId: OpenAiStream.chatId,
                  // streamStatus: ChatGptStreamStatus.ChatGptStreamStatus_DONE,
                },
              });
              return;
            }
          }
        });
      }
    }
  }

  static init(chatId: string, msgId: number) {
    OpenAiStream.chatId = chatId;
    OpenAiStream.msgId = msgId;
    OpenAiStream.text = '';
    OpenAiStream.lastText = '';
    OpenAiStream.cache = {};
    OpenAiStream.loading = true;
  }
}

contextBridge.exposeInMainWorld('WaiApi', {
  onMsgReplyFromOpenAiStream: (message: string) => {
    OpenAiStream.handleMsgReply(message);
  },
});

window.addEventListener('DOMContentLoaded', () => {
  console.log('[DOMContentLoaded] event fired');
  const script = document.createElement('script');

  script.innerHTML = `
  
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/zepto/1.2.0/zepto.min.js';
  document.head.appendChild(script);
  
   (function() {
      const originalFetch = window.fetch;
      window.fetch = async function (...args) {
        const url = args[0];
        const options = args[1];
        console.log("on fetch",url);

        if(options && options.signal && url.indexOf('backend-api/conversation') > 0){
          window.WaiApi.onMsgReplyFromOpenAiStream("[REQUEST] " + JSON.stringify(options))
        }
        const response = await originalFetch.apply(this, args);
        if(options && options.signal && url.indexOf('backend-api/conversation') > 0){
          if (response.ok) {
            if(response.body && options){              
              const transformStream = new TransformStream({
                  transform(chunk, controller) {
                  // 将数据传递给原始调用方
                  controller.enqueue(chunk);
        
                  // 在这里处理数据
                  const decoder = new TextDecoder();
                  const v = decoder.decode(chunk);
                  window.WaiApi.onMsgReplyFromOpenAiStream(v);
                },
              });
    
              // 将原始响应的 body 传递给 TransformStream
              response.body.pipeThrough(transformStream);
        
              return new Response(transformStream.readable, {
                headers: response.headers,
                status: response.status,
                statusText: response.statusText,
              });
            }
          }else{
            window.WaiApi.onMsgReplyFromOpenAiStream("[ERROR] "+ (await response.clone().text()))
          }
        }
        return response;
      };
    })();
  window.addEventListener('sendText', event => {
    if($("button[class*='bottom-[124px]']").length > 0){
      $("button[class*='bottom-[124px]']").trigger("click")
    }
    const { text } = event.detail;
    window.$('textarea').val(text)
    window.$('textarea').next().removeAttr('disabled');
    $('textarea').next().trigger('click');
    console.log('[sendText]', text);
  })
  `;
  document.head.appendChild(script);
});

window.addEventListener('click', event => {
  ipcRenderer.send('onMainMessage', {
    action: 'onClickWindow',
  });
});

ipcRenderer.on('onRenderMessage', (event, args) => {
  console.log('[onRenderMessage]', JSON.stringify(args));
  const { action, payload } = args;
  switch (action) {
    case 'setText':
      if (!OpenAiStream.loading) {
        const { chatId, msgId } = payload;
        OpenAiStream.init(chatId, msgId);
        window.dispatchEvent(new CustomEvent('sendText', { detail: { text: payload.text } }));
      }
      break;
  }
});
