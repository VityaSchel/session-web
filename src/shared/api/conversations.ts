export enum ConversationType {
  DirectMessages,
  ClosedGroup,
  OpenGroup
}

export type Conversation = DirectMessagesConversation | ClosedGroupConversation | OpenGroupConversation

export type DirectMessagesConversation = {
  type: ConversationType.DirectMessages

}

export type ClosedGroupConversation = {
  type: ConversationType.ClosedGroup
  members: any[]
}

export type OpenGroupConversation = {
  type: ConversationType.OpenGroup
}

export function getConversation(key: string): Conversation {
  return {
    type: ConversationType.DirectMessages
  }
}