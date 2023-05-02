import { ActionCommands, getActionCommandsName } from '../../../lib/ptp/protobuf/ActionCommands';
import { Pdu } from '../../../lib/ptp/protobuf/BaseMsg';
import { SendBotMsgReq, SendBotMsgRes } from '../../../lib/ptp/protobuf/PTPMsg';
import { getSessionInfoFromSign } from './User';
import { AuthLoginReq, AuthLoginRes } from '../../../lib/ptp/protobuf/PTPAuth';

let dispatchers: Record<string, MsgDispatcher> = {};

export default class MsgDispatcher {
  private authUserId: string;
  private accountId: string;
  private address: string;
  constructor(accountId: string) {
    this.accountId = accountId;
    if (!dispatchers[accountId]) {
      dispatchers[accountId] = this;
    }
  }

  static getInstance(accountId: string) {
    if (!dispatchers[accountId]) {
      new MsgDispatcher(accountId);
    }
    return dispatchers[accountId];
  }

  private ws: WebSocket | any;
  setWs(ws: WebSocket | any) {
    this.ws = ws;
  }

  setAuthUserId(authUserId: string) {
    this.authUserId = authUserId;
  }

  setAddress(address: string) {
    this.address = address;
  }
  sendPdu(pdu: Pdu, seqNum: number = 0) {
    console.log('sendPdu', getActionCommandsName(pdu.getCommandId()));
    pdu.updateSeqNo(seqNum);
    this.ws.send(pdu.getPbData());
  }
  async handleSendBotMsgReq(pdu: Pdu) {
    let { text, chatId, msgId, chatGpt } = SendBotMsgReq.parseMsg(pdu);
    console.log('handleSendBotMsgReq', { text, chatId, msgId, chatGpt });
    this.sendPdu(
      new SendBotMsgRes({
        reply: 'reply: ' + text,
      }).pack(),
      pdu.getSeqNum()
    );
  }
  async handleAuthLoginReq(pdu: Pdu) {
    const { sign, clientInfo } = AuthLoginReq.parseMsg(pdu);
    const res = await getSessionInfoFromSign(sign);
    console.log('[clientInfo]11', JSON.stringify(clientInfo));
    console.log('[authSession]', JSON.stringify(res));
    if (res) {
      this.setAddress(res.address);
      this.sendPdu(new AuthLoginRes({}).pack(), 0);
    }
  }

  static async handleWsMsg(accountId: string, pdu: Pdu) {
    const dispatcher = MsgDispatcher.getInstance(accountId);
    console.log(
      '[onMessage]',
      getActionCommandsName(pdu.getCommandId()),
      pdu.getSeqNum(),
      pdu.getPbData().slice(0, 16)
    );
    switch (pdu.getCommandId()) {
      case ActionCommands.CID_AuthLoginReq:
        await dispatcher.handleAuthLoginReq(pdu);
        break;
      case ActionCommands.CID_SendBotMsgReq:
        await dispatcher.handleSendBotMsgReq(pdu);
        break;
    }
  }
}
