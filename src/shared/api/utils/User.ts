// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

import _ from 'lodash'
import { toHex } from './String'
import { SessionKeyPair } from '../../../../types/keypairs'
import * as Data from '../data'

export type HexKeyPair = {
  pubKey: string;
  privKey: string;
};

export type ByteKeyPair = {
  pubKeyBytes: Uint8Array;
  privKeyBytes: Uint8Array;
};

export async function getUserED25519KeyPair(): Promise<HexKeyPair | undefined> {
  const ed25519KeyPairBytes = await getUserED25519KeyPairBytes()
  if (ed25519KeyPairBytes) {
    const { pubKeyBytes, privKeyBytes } = ed25519KeyPairBytes
    return {
      pubKey: toHex(pubKeyBytes),
      privKey: toHex(privKeyBytes),
    }
  }
  return undefined
}

export const getUserED25519KeyPairBytes = async (): Promise<ByteKeyPair | undefined> => {
  // 'identityKey' keeps the ed25519KeyPair under a ed25519KeyPair field.
  // it is only set if the user migrated to the ed25519 way of generating a key
  const item = await getIdentityKeyPair()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ed25519KeyPair = (item as any)?.ed25519KeyPair
  if (ed25519KeyPair?.publicKey && ed25519KeyPair?.privateKey) {
    const pubKeyBytes = new Uint8Array(_.map(ed25519KeyPair.publicKey, a => a))
    const privKeyBytes = new Uint8Array(_.map(ed25519KeyPair.privateKey, a => a))
    return {
      pubKeyBytes,
      privKeyBytes,
    }
  }
  return undefined
}

let cachedIdentityKeyPair: SessionKeyPair | undefined

export async function getIdentityKeyPair(): Promise<SessionKeyPair | undefined> {
  if (cachedIdentityKeyPair) {
    return cachedIdentityKeyPair
  }
  const item = await Data.getItemById('identityKey')

  cachedIdentityKeyPair = item?.value
  return cachedIdentityKeyPair
}