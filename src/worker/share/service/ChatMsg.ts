import { Pdu } from '../../../lib/ptp/protobuf/BaseMsg';
import { PbMsg_Type } from '../../../lib/ptp/protobuf/PTPCommon/types';
import { currentTs, sleep } from '../utils/utils';
import * as WebSocketServer from 'ws';
import { getActionCommandsName } from '../../../lib/ptp/protobuf/ActionCommands';

let messageIds: number[] = [];
export const LOCAL_MESSAGE_MIN_ID = 5e9;

const TIMESTAMP_BASE = 1676e9; // 2023-02-10
const TIMESTAMP_PRECISION = 1e2; // 0.1s
const LOCAL_MESSAGES_LIMIT = 1e6; // 1M

let localMessageCounter = LOCAL_MESSAGE_MIN_ID;

export function getNextLocalMessageId() {
  const datePart = Math.round((Date.now() - TIMESTAMP_BASE) / TIMESTAMP_PRECISION);
  return LOCAL_MESSAGE_MIN_ID + datePart + ++localMessageCounter / LOCAL_MESSAGES_LIMIT;
}

export default class ChatMsg {
  static ws_: WebSocketServer;
  private chatId: string;
  constructor(chatId: string) {
    this.chatId = chatId;
  }
  static buildTextMessage(text: string, msg?: Partial<PbMsg_Type>): PbMsg_Type {
    return {
      id: 0,
      chatId: '',
      content: {
        ...msg?.content,
        text: {
          ...msg?.content?.text,
          text,
        },
      },
      date: currentTs(),
      isOutgoing: false,
      ...msg,
    };
  }

  static async genMessageId(): Promise<number> {
    let msgId = getNextLocalMessageId();
    if (messageIds.length > 10) {
      messageIds = messageIds.slice(messageIds.length - 10);
    }
    if (messageIds.indexOf(msgId) > -1) {
      await sleep(100);
      return ChatMsg.genMessageId();
    } else {
      messageIds.push(msgId);
      return msgId;
    }
  }

  static sendPdu(pdu: Pdu, ws?: WebSocket, seqNum?: number) {
    console.log('sendPdu', getActionCommandsName(pdu.getCommandId()));
    if (ws) {
      pdu.updateSeqNo(seqNum || 0);
      ws.send(pdu.getPbData());
    } else {
      pdu.updateSeqNo(seqNum || 0);
      ChatMsg.ws_.send(pdu.getPbData());
    }
  }
}
