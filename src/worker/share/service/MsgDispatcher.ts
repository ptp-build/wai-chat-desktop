import { ActionCommands, getActionCommandsName } from '../../../lib/ptp/protobuf/ActionCommands';
import { Pdu } from '../../../lib/ptp/protobuf/BaseMsg';
import {
  SendBotMsgReq,
  SendBotMsgRes,
  UpdateCmdReq,
  UpdateCmdRes,
} from '../../../lib/ptp/protobuf/PTPMsg';
import { getSessionInfoFromSign } from './User';
import { AuthLoginReq, AuthLoginRes } from '../../../lib/ptp/protobuf/PTPAuth';
import { ERR } from '../../../lib/ptp/protobuf/PTPCommon/types';
import { BotWsServer } from './BotWsServer';

let dispatchers: Record<string, MsgDispatcher> = {};

export default class MsgDispatcher {
  private authUserId: string;
  private accountId: string;
  private address: string;
  private wsBot: BotWsServer;
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
  setWsBot(wsBot: BotWsServer) {
    this.wsBot = wsBot;
  }
  setAuthUserId(authUserId: string) {
    this.authUserId = authUserId;
  }

  setAddress(address: string) {
    this.address = address;
  }
  sendPdu(pdu: Pdu, seqNum: number = 0) {
    pdu.updateSeqNo(seqNum);
    console.log('[sendPdu]', getActionCommandsName(pdu.getCommandId()), pdu.getSeqNum());
    this.wsBot.sendToClient(pdu);
  }

  sendToRender(action: string, payload?: any) {
    this.wsBot.sendMsgToRender(action, payload);
  }

  async handleAuthLoginReq(pdu: Pdu) {
    const { sign, clientInfo } = AuthLoginReq.parseMsg(pdu);
    const res = await getSessionInfoFromSign(sign);
    console.log('[clientInfo]', JSON.stringify(clientInfo));
    console.log('[authSession]', JSON.stringify(res));
    this.sendToRender('handleSendBotMsgReq', { clientInfo, session: res });
    if (res) {
      this.setAddress(res.address);
      this.sendPdu(new AuthLoginRes({ err: ERR.NO_ERROR }).pack(), pdu.getSeqNum());
    }
  }
  async handleSendBotMsgReq(pdu: Pdu) {
    let { text, chatId, msgId, chatGpt } = SendBotMsgReq.parseMsg(pdu);
    console.log('handleSendBotMsgReq', { text, chatId, msgId, chatGpt });
    if (text) {
      this.sendToRender('CID_SendBotMsgReq', { text, chatId, msgId });
      this.sendPdu(
        new SendBotMsgRes({
          reply: '```' + text + '```',
        }).pack(),
        pdu.getSeqNum()
      );
    }
    if (chatGpt) {
      this.sendPdu(
        new SendBotMsgRes({
          reply:
            '```json\n' +
            JSON.stringify(
              {
                chatGpt: JSON.parse(chatGpt),
                msgId,
                chatId,
              },
              null,
              2
            ) +
            '```',
        }).pack(),
        pdu.getSeqNum()
      );
      this.sendToRender('CID_SendBotMsgReq', {
        chatId,
        msgId,
        text: JSON.parse(chatGpt).messages[0].content,
      });
    }
  }

  async handleUpdateCmdReq(pdu: Pdu) {
    let { chatId } = UpdateCmdReq.parseMsg(pdu);
    this.sendPdu(
      new UpdateCmdRes({
        commands: [{ botId: chatId, command: 'tt', description: 'tt' }],
      }).pack(),
      pdu.getSeqNum()
    );
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
      case ActionCommands.CID_UpdateCmdReq:
        await dispatcher.handleUpdateCmdReq(pdu);
        break;
      case ActionCommands.CID_SendBotMsgReq:
        await dispatcher.handleSendBotMsgReq(pdu);
        break;
    }
  }
}
