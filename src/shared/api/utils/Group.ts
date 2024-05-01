// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

import { PubKey } from '../pubkey'
import { ConversationType, getConversation } from '../conversations'
import { fromHexToArray } from './String'

export function getGroupMembers(groupId: PubKey): Array<PubKey> {
  const groupConversation = getConversation(groupId.key)
  if (groupConversation.type !== ConversationType.ClosedGroup) throw new Error('Invalid group type')
  const groupMembers = groupConversation ? groupConversation.members : undefined

  if (!groupMembers) {
    return []
  }

  return groupMembers.map(PubKey.cast)
}

export function isClosedGroup(groupId: PubKey): boolean {
  const conversation = getConversation(groupId.key)

  if (!conversation) {
    return false
  }

  return Boolean(conversation.type === ConversationType.ClosedGroup)
}

export function encodeGroupPubKeyFromHex(hexGroupPublicKey: string | PubKey) {
  const pubkey = PubKey.cast(hexGroupPublicKey)
  return fromHexToArray(pubkey.key)
}
