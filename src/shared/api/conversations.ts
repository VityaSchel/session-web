import * as Storage from './storage'

export enum ConversationType {
  DirectMessages,
  ClosedGroup,
  OpenGroup
}

export type Conversation = DirectMessagesConversation | ClosedGroupConversation | OpenGroupConversation

export type DirectMessagesConversation = {
  type: ConversationType.DirectMessages
  displayName: string
  displayImage?: Blob
}

export type ClosedGroupMember = {
  displayName: string
  profileImage?: Blob
}

export type ClosedGroupConversation = {
  type: ConversationType.ClosedGroup
  members: ClosedGroupMember[]
  displayName: string
  displayImage?: Blob
}

export type OpenGroupConversation = {
  type: ConversationType.OpenGroup
  displayName: string
  displayImage?: Blob
}

export async function getConversation(key: string): Promise<Conversation | null> {
  const conversation = await Storage.db.conversations.get(key)
  return conversation ?? null
}

export async function getConversations(): Promise<Conversation[]> {
  const conversations = await Storage.db.conversations.toArray()
  return conversations
}