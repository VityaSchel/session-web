// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

import { ConversationType, getConversation } from '../conversations'
import { fromHexToArray } from './String'

export async function getGroupMembers(groupId: string): Promise<string[]> {
  const groupConversation = await getConversation(groupId)
  if (!groupConversation) {
    return []
  }

  if (groupConversation.type !== ConversationType.ClosedGroup) throw new Error('Invalid group type')
  const groupMembers = groupConversation ? groupConversation.members : undefined

  if (!groupMembers) {
    return []
  }

  return groupMembers.map(m => m.sessionID)
}

export async function isClosedGroup(groupId: string): Promise<boolean> {
  const conversation = await getConversation(groupId)

  if (!conversation) {
    return false
  }

  return Boolean(conversation.type === ConversationType.ClosedGroup)
}

export function encodeGroupPubKeyFromHex(hexGroupPublicKey: string | string) {
  return fromHexToArray(hexGroupPublicKey)
}
