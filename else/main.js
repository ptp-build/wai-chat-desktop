const { app, BrowserWindow,ipcMain } = require('electron')
const robot = require('robotjs');
const path = require('path');
const WebSocket = require('ws');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        x:0,
        y:0,
        width: 800,
        height: 600,
        fullscreen: false,
        devTools: true, // 启用控制台输出
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            // 在这里设置 CSP
            webSecurity: true,
            // 允许加载外部资源
            allowRunningInsecureContent: false,
            preload: path.join(__dirname, 'preload.js'),
        },
    });
    // mainWindow.maximize();
    // mainWindow.loadFile('index.html');

    mainWindow.loadURL('https://chat.openai.com');
    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        console.log('>', message);
    });
    mainWindow.webContents.on('did-finish-load', () => {
        // mainWindow.webContents.openDevTools();
        mainWindow.webContents.send('inject-scripts');

        ipcMain.on('simulate-mouse-click', (event, { }) => {
            var mouse = robot.getMousePos();
            console.log(`robot.moveMouse(${mouse.x},${mouse.y});`)
        });

        setTimeout(() => {
            robot.moveMouse(513,136);
            robot.mouseClick("down");

            console.log("mouseClick 8")
        },5000)

        // setTimeout(() => {
        //     robot.moveMouse(584,226);
        //     robot.mouseClick()
        //     console.log("mouseClick 9")
        // },10000)
        //
        // setTimeout(() => {
        //     robot.moveMouse(448,543);
        //     robot.mouseClick()
        //     robot.typeString("Hello World");
        //     console.log("mouseClick 10")
        // },11000)
//
//         setTimeout(() => {
//             // Speed up the mouse.
//             robot.setMouseDelay(2);
//
//             var twoPI = Math.PI * 2.0;
//             var screenSize = robot.getScreenSize();
//             var height = (screenSize.height / 2) - 10;
//             var width = screenSize.width;
//
//             for (var x = 0; x < width; x++)
//             {
//                 y = height * Math.sin((twoPI * x) / width) + height;
//                 robot.moveMouse(x, y);
//             }
//
//         }, 1000);
//
//         setTimeout(() => {
//
// // Type "Hello World".
//             robot.typeString("Hello World");
//
// // Press enter.
//             robot.keyTap("enter");
//
//         }, 3000);

    });

}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});


// WebSocket server
const wss = new WebSocket.Server({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');

    ws.on('message', (message) => {
        console.log(`Received message: ${message}`);
        ws.send('Message received');
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
