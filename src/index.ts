import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';

declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

const WS_PORT = 1236;
const OPEN_DEVTOOL = false;

const chatGpt3_url = 'https://chat.openai.com/c/3cb7d4d3-c9b3-46a9-bff8-889cb614ae12';
const chatGpt4_url = 'https://chat.openai.com/c/9bfc0438-5694-4ca1-a297-e67cfc5b265d';

if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null;
let devToolsWindow: BrowserWindow;

// const botWsServer = new BotWsServer();

const onBotWsMessage = ({ action, payload }: { action: string; payload: any }) => {
  console.log('[onBotWsMessage]', action, payload);
  switch (action) {
    case 'CID_SendBotMsgReq':
      const { chatId, msgId } = payload;
      mainWindow.webContents.send('onRenderMessage', {
        action: 'setText',
        payload: {
          text: payload.text,
          chatId,
          msgId,
        },
      });
      break;
  }
};
const createWindow = (): void => {
  if (mainWindow) {
    mainWindow.focus();
    return;
  }
  // 销毁旧的 devToolsWindow
  if (devToolsWindow) {
    devToolsWindow.close();
    devToolsWindow.destroy();
    devToolsWindow = null;
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    x: 0,
    y: 0,
    title: 'Wai Chat',
    webPreferences: {
      // preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      preload: path.join(__dirname, 'js', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'assets', 'index.html'));
  // mainWindow.loadURL(`file://${path.join(__dirname, 'index.html')}`);
  // mainWindow.loadURL('http://localhost:1234').catch(console.error);

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log('>', message);
    });

    mainWindow.webContents.send('inject-scripts');
  });
  ipcMain.on('onMainMessage', async (event, args) => {
    const { action, payload } = args;
    console.log('[onMainMessage]', action, payload);
    switch (action) {
      case 'onSend':
        mainWindow.focus();
        break;
      case 'onRecvAiMsg':
        const { reply, msgId, chatId, streamStatus } = payload;
        // botWsServer.sendToClient(new SendBotMsgRes({ reply, msgId, chatId, streamStatus }).pack());
        break;
      case 'onClickWindow':
        break;
    }
  });
  if (OPEN_DEVTOOL) {
    // 打开 DevTools
    mainWindow.webContents.once('did-frame-finish-load', () => {
      mainWindow.webContents.setDevToolsWebContents(devToolsWindow.webContents);
      mainWindow.webContents.openDevTools({ mode: 'detach' });
    });

    // 创建 DevTools 窗口
    devToolsWindow = new BrowserWindow({
      x: 750, // 设置 DevTools 窗口的 x 坐标
      y: 0, // 设置 DevTools 窗口的 y 坐标
      show: false,
    });

    // 监听 DevTools 的打开和关闭事件
    mainWindow.webContents.on('devtools-opened', () => {
      if (devToolsWindow) {
        devToolsWindow.show();
      }
    });

    mainWindow.webContents.on('devtools-closed', () => {
      if (devToolsWindow) {
        devToolsWindow.destroy();
        devToolsWindow = null;
      }
    });
  }

  mainWindow.on('ready-to-show', function () {
    // var proxyIp = '83.97.23.90';
    // var port = '18080';
    // let my_proxy = proxyIp.trim() === 'noproxy' ? 'direct://' : 'http://' + proxyIp + ':' + port;
    // session.defaultSession
    //   .setProxy({ proxyRules: my_proxy })
    //   .then(() => {
    //     console.log('proxy: ' + my_proxy);
    //   })
    //   .catch(console.error);
  });

  mainWindow.on('resize', () => {
    const [width, height] = mainWindow.getSize();
    console.log(`New window size: {width:${width}, height: ${height}}`);
  });
  mainWindow.on('closed', (e: any) => {
    console.log(e);
    mainWindow = null;
  });
};

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      createWindow();
    }
  });
}
app.on('ready', async () => {
  // await botWsServer.start(WS_PORT).catch(console.error);
  // botWsServer.on('onBotWsMessage', onBotWsMessage);
  createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  // if (botWsServer) {
  //   botWsServer.removeListener('onBotWsMessage', onBotWsMessage);
  // }
  // botWsServer.close();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
