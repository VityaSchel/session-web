// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

import sodium from 'libsodium-wrappers-sumo'
import * as StringUtils from './utils/String'
import { WithShortenOrExtend } from '../../types/snode-request-types'
import * as UserUtils from './utils/User'
import * as GetNetworkTime from './get-network-time'

export type SnodeSignatureResult = {
  timestamp: number;
  // sig_timestamp: number;
  signature: string;
  pubkey_ed25519: string;
  pubkey: string; // this is the x25519 key of the pubkey we are doing the request to (ourself for our swarm usually)
};

async function getSnodeSignatureByHashesParams({
  messages,
  method,
  pubkey
}: {
  pubkey: string;
  messages: Array<string>;
  method: 'delete';
  userPubkey: string
}): Promise<
  Pick<SnodeSignatureResult, 'pubkey_ed25519' | 'signature' | 'pubkey'> & {
    messages: Array<string>;
  }
> {
  const ourEd25519Key = await UserUtils.getUserED25519KeyPair()

  if (!ourEd25519Key) {
    throw new Error(`getSnodeSignatureParams "${method}": User has no getUserED25519KeyPair()`)
  }
  const edKeyPrivBytes = StringUtils.fromHexToArray(ourEd25519Key?.privKey)
  const verificationData = StringUtils.encode(`${method}${messages.join('')}`, 'utf8')
  const message = new Uint8Array(verificationData)

  const signature = sodium.crypto_sign_detached(message, edKeyPrivBytes)
  const signatureBase64 = StringUtils.fromUInt8ArrayToBase64(signature)

  return {
    signature: signatureBase64,
    pubkey_ed25519: ourEd25519Key.pubKey,
    pubkey,
    messages,
  }
}

async function getSnodeSignatureParams(params: {
  pubkey: string;
  namespace: number | null | 'all'; // 'all' can be used to clear all namespaces (during account deletion)
  method: 'retrieve' | 'store' | 'delete_all';
}): Promise<SnodeSignatureResult> {
  const ourEd25519Key = await UserUtils.getUserED25519KeyPair()

  if (!ourEd25519Key) {
    throw new Error(`getSnodeSignatureParams "${params.method}": User has no getUserED25519KeyPair()`)
  }
  const namespace = params.namespace || 0
  const edKeyPrivBytes = StringUtils.fromHexToArray(ourEd25519Key?.privKey)

  const signatureTimestamp = await GetNetworkTime.getNowWithNetworkOffset()

  const withoutNamespace = `${params.method}${signatureTimestamp}`
  const withNamespace = `${params.method}${namespace}${signatureTimestamp}`
  const verificationData =
    namespace === 0
      ? StringUtils.encode(withoutNamespace, 'utf8')
      : StringUtils.encode(withNamespace, 'utf8')

  const message = new Uint8Array(verificationData)

  const signature = sodium.crypto_sign_detached(message, edKeyPrivBytes)
  const signatureBase64 = StringUtils.fromUInt8ArrayToBase64(signature)

  return {
    // sig_timestamp: signatureTimestamp,
    timestamp: signatureTimestamp,
    signature: signatureBase64,
    pubkey_ed25519: ourEd25519Key.pubKey,
    pubkey: params.pubkey,
  }
}

/**
 * NOTE if shortenOrExtend is an empty string it means we want to hardcode the expiry to a TTL value, otherwise it's to shorten or extend the TTL
 */
async function generateUpdateExpirySignature({
  shortenOrExtend,
  timestamp,
  messageHashes,
}: {
  timestamp: number;
  messageHashes: Array<string>;
} & WithShortenOrExtend): Promise<{ signature: string; pubkey_ed25519: string } | null> {
  const ourEd25519Key = await UserUtils.getUserED25519KeyPair()

  if (!ourEd25519Key) {
    throw new Error('getSnodeSignatureParams "expiry": User has no getUserED25519KeyPair()')
  }

  const edKeyPrivBytes = StringUtils.fromHexToArray(ourEd25519Key?.privKey)

  // ("expire" || ShortenOrExtend || expiry || messages[0] || ... || messages[N])
  const verificationString = `expire${shortenOrExtend}${timestamp}${messageHashes.join('')}`
  const verificationData = StringUtils.encode(verificationString, 'utf8')
  const message = new Uint8Array(verificationData)

  try {
    const signature = sodium.crypto_sign_detached(message, edKeyPrivBytes)
    const signatureBase64 = StringUtils.fromUInt8ArrayToBase64(signature)

    return {
      signature: signatureBase64,
      pubkey_ed25519: ourEd25519Key.pubKey,
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error('getSnodeSignatureParams "expiry" failed with: ', e.message)
    }
    return null
  }
}

async function generateGetExpiriesSignature({
  timestamp,
  messageHashes,
}: {
  timestamp: number;
  messageHashes: Array<string>;
}): Promise<{ signature: string; pubkey_ed25519: string } | null> {
  const ourEd25519Key = await UserUtils.getUserED25519KeyPair()
  if (!ourEd25519Key) {
    throw new Error('getSnodeSignatureParams "get_expiries": User has no getUserED25519KeyPair()')
  }

  const edKeyPrivBytes = StringUtils.fromHexToArray(ourEd25519Key?.privKey)

  // ("get_expiries" || timestamp || messages[0] || ... || messages[N])
  const verificationString = `get_expiries${timestamp}${messageHashes.join('')}`
  const verificationData = StringUtils.encode(verificationString, 'utf8')
  const message = new Uint8Array(verificationData)

  try {
    const signature = sodium.crypto_sign_detached(message, edKeyPrivBytes)
    const signatureBase64 = StringUtils.fromUInt8ArrayToBase64(signature)

    return {
      signature: signatureBase64,
      pubkey_ed25519: ourEd25519Key.pubKey,
    }
  } catch (e) {
    if(e instanceof Error)
      console.warn('generateSignature "get_expiries" failed with: ', e.message)
    return null
  }
}

export const SnodeSignature = {
  getSnodeSignatureParams,
  getSnodeSignatureByHashesParams,
  generateUpdateExpirySignature,
  generateGetExpiriesSignature,
}
