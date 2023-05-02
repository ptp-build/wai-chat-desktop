import WebSocket from 'ws';
import { Pdu } from '../../../lib/ptp/protobuf/BaseMsg';
import { getActionCommandsName } from '../../../lib/ptp/protobuf/ActionCommands';
import MsgDispatcher from './MsgDispatcher';
import { currentTs1000 } from '../utils/utils';
import * as net from 'net';
import { exec } from 'child_process';

export class BotWsServer {
  private port: number;
  private wss?: WebSocket.Server;
  constructor(port: number) {
    this.port = port;
  }

  async start() {
    const { port } = this;

    // 检查端口是否被占用
    const isPortUsed = await this.isPortInUse(this.port);

    if (isPortUsed) {
      console.log(`Port ${this.port} is in use. Killing the process...`);

      // 杀死占用端口的进程
      await this.killProcessUsingPort(this.port);
    }
    // WebSocket server
    const wss = (this.wss = new WebSocket.Server({ port }));
    const accountId = currentTs1000().toString();
    const msgDispatcher = MsgDispatcher.getInstance(accountId);
    msgDispatcher.setWs(wss);
    wss.on('connection', ws => {
      console.log('Client connected');
      ws.on('message', async (msg: Buffer) => {
        try {
          const pdu = new Pdu(Buffer.from(msg));
          console.log('[message]', getActionCommandsName(pdu.getCommandId()));
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
    if (this.wss) {
      this.wss.close();
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
