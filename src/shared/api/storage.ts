import { SessionKeyPairLibsodiumSumo as SessionKeyPair } from '../../../types/keypairs'
import { PubKey } from '@/shared/api/pubkey'
import { HexKeyPair } from '@/shared/api/eckeypair'
import Dexie, { Table } from 'dexie'
import { Conversation } from '@/shared/api/conversations'
import { toHex } from '@/shared/api/utils/String'

type BooleanAsNumber = 0 | 1

export type DbAccount = {
  sessionID: string
  mnemonic: string
  displayName?: string
  profileImage?: Blob
}

export type DbConversation = {
  accountSessionID: string
  id: string
  lastMessage: {
    direction: 'incoming' | 'outgoing'
    textContent: string | null
  }
  lastMessageTime: number
} & Conversation

export type DbMessage = {
  direction: 'incoming' | 'outgoing'
  accountSessionID: string
  hash: string
  /** Generated and used internally */
  id: string
  conversationID: string
  read: BooleanAsNumber
  textContent: string | null
  timestamp: number
  sendingStatus: 'sending' | 'error' | 'sent'
}

export type DbUser = {
  sessionID: string
  displayName?: string
  profileImage?: Blob
}

export type DbMessageSeen = {
  hash: string
  receivedAt: number
  accountSessionID: string
}

export class SessionWebDatabase extends Dexie {
  accounts!: Table<DbAccount>
  conversations!: Table<DbConversation>
  messages!: Table<DbMessage>
  users!: Table<DbUser>
  messages_seen!: Table<DbMessageSeen>

  constructor() {
    super('session-web')
    this.version(1).stores({
      accounts: 'sessionID',
      conversations: 'id, accountSessionID, [id+accountSessionID], lastMessageTime',
      messages: 'hash, id, conversationID, read, accountSessionID, [conversationID+accountSessionID], [conversationID+accountSessionID+read], sendingStatus, [conversationID+accountSessionID+hash+sendingStatus]',
      users: 'sessionID',
      messages_seen: 'hash, receivedAt, accountSessionID'
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

export async function isMessageSeen(hash: string) {
  return Boolean(await db.messages_seen.get(hash))
}

export async function setMessageSeen(hash: string) {
  const keypair = getIdentityKeyPair()
  if (!keypair) throw new Error('No identity keypair found')
  await db.messages_seen.add({ 
    hash, 
    receivedAt: Date.now(), 
    accountSessionID: toHex(keypair.pubKey)
  })
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