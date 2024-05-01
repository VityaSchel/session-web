// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

import { SignalService } from '@/shared/api/signal-service'
import { SnodeNamespaces } from '../../../../types/namespaces'
import { v4 as uuid } from 'uuid'

export type LokiProfile = {
  displayName: string;
  avatarPointer?: string;
  profileKey: Uint8Array | null;
};


export interface MessageParams {
  timestamp: number;
  identifier?: string;
}

export abstract class Message {
  public readonly timestamp: number
  public readonly identifier: string

  constructor({ timestamp, identifier }: MessageParams) {
    this.timestamp = timestamp
    if (identifier && identifier.length === 0) {
      throw new Error('Cannot set empty identifier')
    }
    if (!timestamp) {
      throw new Error('Cannot set undefined timestamp')
    }
    this.identifier = identifier || uuid()
  }
}

export abstract class ContentMessage extends Message {
  public plainTextBuffer(): Uint8Array {
    return SignalService.Content.encode(this.contentProto()).finish()
  }

  public ttl(): number {
    return 14 * 24 * 60 * 60 * 1000
  }

  public abstract contentProto(): SignalService.Content;
}

export type RawMessage = {
  identifier: string;
  plainTextBuffer: Uint8Array;
  recipient: string;
  ttl: number;
  encryption: SignalService.Envelope.Type;
  namespace: SnodeNamespaces
};

export function toRawMessage(
  destinationPubKey: string,
  message: ContentMessage,
  namespace: SnodeNamespaces,
  // isGroup = false
): RawMessage {
  const ttl = message.ttl()
  const plainTextBuffer = message.plainTextBuffer()

  const encryption = // TODO: if closed group, use SignalService.Envelope.Type.CLOSED_GROUP_MESSAGE
    SignalService.Envelope.Type.SESSION_MESSAGE

  const rawMessage: RawMessage = {
    identifier: message.identifier,
    plainTextBuffer,
    recipient: destinationPubKey,
    ttl,
    encryption,
    namespace,
  }

  return rawMessage
}