// 导入 Electron 的 contextBridge 和 ipcRenderer 模块
const { contextBridge, ipcRenderer } = require('electron');

// 使用 contextBridge 在预加载脚本中暴露一个名为 myAPI 的对象到 window 对象中
contextBridge.exposeInMainWorld('myAPI', {
    // 在 myAPI 对象中添加一个名为 sendWebSocketMessage 的方法，该方法用于发送 WebSocket 消息
    sendWebSocketMessage: (message) => {
        // 通过全局变量 window.socket 发送消息到 WebSocket 服务器
        window.socket.send(message);
    }
});

// 在全局作用域中创建 WebSocket 对象，并监听 open 和 close 事件
window.socket = new WebSocket('wss://wai-chat-bot-websocket.ptp-ai.workers.dev');
window.socket.addEventListener('open', () => {
    console.log('WebSocket opened');
});
window.socket.addEventListener('close', () => {
    console.log('WebSocket closed');
});

// 当 DOMContentLoaded 事件触发时，注入一个脚本来重写 fetch 方法
window.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired');

    // 创建一个新的 script 元素
    const script = document.createElement('script');

    // 在 script 元素中注入一个匿名函数，该函数用于重写 fetch 方法
    script.innerHTML = `
    (function() {
      console.log("originalFetch rewrite")
      // 将原始的 fetch 方法保存到 window 对象的 originalFetch 属性中
      window.originalFetch = window.fetch;

      // 重写 fetch 方法
      window.fetch = async function(url, options) {
        // 调用原始的 fetch 方法，并等待其返回结果
        const response = await window.originalFetch(url, options);

        // 如果响应正常（即状态码为 2xx），则读取响应文本并发送到 WebSocket 服务器
        if (response.ok && response.body) {
          console.log('fetch response:', url);
          const reader = response.clone().body.getReader();
          const decoder = new TextDecoder();
          let text = '';
          let lastText = ""
          const cache = {}
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            const v = decoder.decode(value)
           
            text += v;
            if(url.indexOf("backend-api/conversation") > 0 && text.indexOf("data:") === 0){
                let lines = text.substring(5).split("data:").filter(row=>row!== "").map(row=>row.trim());
                
                if(lines && lines.length > 0){
                    lines.forEach((line,i)=>{
                        if(line.indexOf("{") === 0 && line.substring(line.length-1) === "}"){
                            try{
                                const text = JSON.parse(line).message.content.parts[0];
                                if(!cache[text]){
                                    cache[text] = true;
                                    console.log("====>>",text.replace(lastText,""))
                                    lastText = text
                                }
                            }catch(e){}
                            
                            
                        }else{
                            if(line === '[DONE]'){
                                console.log("====>>",line,lines[i-1])
                            }
                        }
                    }) 
                }
                
            }
            // window.myAPI.sendWebSocketMessage(v);
          }

          console.log('fetched data:', text);
        }

        // 返回响应结果
        return response;
      };
    })();
  `;

    // 将 script 元素添加到文档的 body 元素中
    document.body.appendChild(script);
});
