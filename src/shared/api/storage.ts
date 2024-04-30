import { fromHex } from 'bytebuffer'
import { SessionKeyPairLibsodiumSumo as SessionKeyPair } from '../../../types/keypairs'
import { toHex } from '@/shared/api/utils/String'
import { PubKey } from '@/shared/api/pubkey'
import { HexKeyPair } from '@/shared/api/eckeypair'
import Dexie, { Table } from 'dexie'
import { Conversation } from '@/shared/api/conversations'

export type DbAccount = {
  sessionID: string
  displayName: string
  profileImage?: Blob
  keypair: SessionKeyPair
}

export type DbConversation = {
  id: string
} & Conversation

export type DbMessage = {
  hash: string
  conversationID: string
  read: boolean
}

export class SessionWebDatabase extends Dexie {
  accounts!: Table<DbAccount>
  conversations!: Table<DbConversation>
  messages!: Table<DbMessage>

  constructor() {
    super('session-web')
    this.version(1).stores({
      accounts: 'sessionID',
      conversations: 'id',
      messages: 'hash, conversationID, read'
    })
  }
}


export const db = new SessionWebDatabase()

export type SessionKeyPairStorage = {
  ed25519KeyPair: {
    keyType: SessionKeyPair['ed25519KeyPair']['keyType']
    privateKey: number[]
    publicKey: number[]
  }
  privKey: string
  pubKey: string
}

export async function getIdentityKeyPair(): Promise<SessionKeyPair | undefined> {
  const value = window.localStorage.getItem('identity-key')
  if (value) {
    const keypair = JSON.parse(value) as SessionKeyPairStorage
    return {
      ed25519KeyPair: {
        keyType: keypair.ed25519KeyPair.keyType,
        privateKey: new Uint8Array(keypair.ed25519KeyPair.privateKey),
        publicKey: new Uint8Array(keypair.ed25519KeyPair.publicKey)
      },
      privKey: fromHex(keypair.privKey).toArrayBuffer(),
      pubKey: fromHex(keypair.pubKey).toArrayBuffer(),
    } satisfies SessionKeyPair
  } else {
    return undefined
  }
}

export async function setIdentityKeypair(keypair: SessionKeyPair) {
  const serialized = JSON.stringify({
    ed25519KeyPair: {
      keyType: keypair.ed25519KeyPair.keyType,
      privateKey: Array.from(new Uint8Array(keypair.ed25519KeyPair.privateKey)),
      publicKey: Array.from(new Uint8Array(keypair.ed25519KeyPair.publicKey))
    },
    privKey: toHex(keypair.privKey),
    pubKey: toHex(keypair.pubKey)
  } satisfies SessionKeyPairStorage)
  window.localStorage.setItem('identity-key', serialized)
}

export function isMessageSeen(hash: string) {
  return Boolean(window.localStorage.getItem('message-'+hash))
}

export function setMessageSeen(hash: string) {
  return window.localStorage.setItem('message-'+hash, String(Date.now()))
}

/**
 * The returned array is ordered based on the timestamp, the latest is at the end.
 */
export async function getAllEncryptionKeyPairsForGroup(
  groupPublicKey: string | PubKey
): Promise<Array<HexKeyPair> | undefined> {
  const pubkey = (groupPublicKey as PubKey).key || (groupPublicKey as string)
  const items = window.localStorage.getItem('group-'+pubkey)
  return items ? JSON.parse(items) : undefined
}