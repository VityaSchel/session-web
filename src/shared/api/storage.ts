import { SessionKeyPairLibsodiumSumo as SessionKeyPair } from '../../../types/keypairs'
import { PubKey } from '@/shared/api/pubkey'
import { HexKeyPair } from '@/shared/api/eckeypair'
import Dexie, { Table } from 'dexie'
import { Conversation } from '@/shared/api/conversations'

export type DbAccount = {
  sessionID: string
  mnemonic: string
  displayName?: string
  profileImage?: Blob
}

export type DbConversation = {
  accountSessionID: string
  id: string
} & Conversation

export type DbMessage = {
  accountSessionID: string
  hash: string
  conversationID: string
  read: boolean
  textContent: string | null
  timestamp: number
}

export type DbUser = {
  sessionID: string
  displayName?: string
  profileImage?: Blob
}

export class SessionWebDatabase extends Dexie {
  accounts!: Table<DbAccount>
  conversations!: Table<DbConversation>
  messages!: Table<DbMessage>
  users!: Table<DbUser>

  constructor() {
    super('session-web')
    this.version(1).stores({
      accounts: 'sessionID',
      conversations: 'id, accountSessionID',
      messages: 'hash, conversationID, read, accountSessionID',
      users: 'sessionID'
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

let identityKeyPair: SessionKeyPair | undefined

export function getIdentityKeyPair(): SessionKeyPair | undefined {
  return identityKeyPair
}

export function setIdentityKeypair(keypair: SessionKeyPair | undefined) {
  identityKeyPair = keypair
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