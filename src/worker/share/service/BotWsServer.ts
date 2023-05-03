import WebSocket from 'ws';
import { Pdu } from '../../../lib/ptp/protobuf/BaseMsg';
import MsgDispatcher from './MsgDispatcher';
import { currentTs1000 } from '../utils/utils';
import * as net from 'net';
import { exec } from 'child_process';
import { EventEmitter } from 'events';

export class BotWsServer extends EventEmitter {
  private port: number;
  private socketServer?: WebSocket.Server;
  private ws: WebSocket.WebSocket;
  sendMsgToRender(action: string, payload?: any) {
    if (this) {
      this.emit('onBotWsMessage', {
        action,
        payload,
      });
    }
  }
  sendToClient(pdu: Pdu) {
    if (this.ws) {
      this.ws.send(pdu.getPbData());
    }
  }
  async start(port: number) {
    this.port = port;

    // 检查端口是否被占用
    const isPortUsed = await this.isPortInUse(this.port);

    if (isPortUsed) {
      console.log(`Port ${this.port} is in use. Killing the process...`);
      await this.killProcessUsingPort(this.port);
    }
    const socketServer = (this.socketServer = new WebSocket.Server({ port }));
    const accountId = currentTs1000().toString();
    const msgDispatcher = MsgDispatcher.getInstance(accountId);
    socketServer.on('connection', ws => {
      this.ws = ws;
      console.log('Client connected');
      msgDispatcher.setWsBot(this);
      this.sendMsgToRender('clientConnected');
      ws.on('message', async (msg: Buffer) => {
        try {
          const pdu = new Pdu(Buffer.from(msg));
          await MsgDispatcher.handleWsMsg(accountId, pdu);
        } catch (err) {
          console.error(err);
        }
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });

    console.log('WebSocket server is running on ws://localhost:' + this.port);
  }
  close() {
    if (this.socketServer) {
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }
      this.socketServer.close();
      this.socketServer = null;
    }
  }
  private isPortInUse(port: number): Promise<boolean> {
    return new Promise(resolve => {
      const server = net.createServer();
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(false);
      });

      server.listen(port);
    });
  }
  private async killProcessUsingPort(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      exec(`lsof -i :${port} | awk 'NR!=1 {print $2}' | xargs kill -9`, error => {
        if (error) {
          console.error(`Failed to kill process on port ${port}:`, error);
          reject(error);
        } else {
          console.log(`Killed process on port ${port}`);
          resolve();
        }
      });
    });
  }
}
