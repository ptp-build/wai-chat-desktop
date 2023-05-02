import Account from '../Account';

export type AuthSessionType = {
  authUserId: string;
  ts: number;
  address: string;
  clientId: number;
};

export async function getSessionInfoFromSign(token: string) {
  const res = token.split('_');
  const sign = res[0];
  const ts = parseInt(res[1]);
  const clientId = parseInt(res[3]);
  const account = new Account(clientId);
  const { address } = account.recoverAddressAndPubKey(Buffer.from(sign, 'hex'), ts.toString());
  if (!address) {
    return;
  }
  return { ts, address, clientId };
}
