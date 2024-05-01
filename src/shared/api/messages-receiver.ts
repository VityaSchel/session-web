// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

import { pollSnode } from '@/shared/api/snodes'
import { SnodeNamespaces } from '../../../types/namespaces'
import * as UserUtils from '@/shared/api/utils/User'
import { toHex } from '@/shared/api/utils/String'
import { RetrieveMessageItem } from '../../../types/retrieve-message-item'
import _ from 'lodash'
import * as Storage from './storage'
import { SignalService } from '@/shared/api/signal-service'
import { decryptNewMessage, extractWebSocketContent } from '@/shared/api/messages-decrypter'

export type NewMessage = {
  from: string;
  to: string | undefined;
  envelope: SignalService.Envelope;
  content: SignalService.Content;
  sentAtTimestamp: number;
  hash: string;
}

export async function getNewMessages(swarm: string): Promise<NewMessage[]> {
  const keypair = await UserUtils.getIdentityKeyPair()
  if (!keypair) throw new Error('No identity keypair found')

  const lastSeenMessage = await (await Storage.db.messages_seen
    .where({ accountSessionID: toHex(keypair.pubKey) })
    .sortBy('receivedAt')).at(-1)

  const results = await pollSnode({
    swarm,
    namespace: SnodeNamespaces.UserMessages,
    pubkey: toHex(keypair.pubKey),
    ...(lastSeenMessage && { lastHash: lastSeenMessage.hash })
  })
  const receivedMessages = _.uniqBy(results.messages.messages as RetrieveMessageItem[], x => x.hash)
  
  const newMessages: RetrieveMessageItem[] = []
  for (const msg of receivedMessages) {
    if (!await Storage.isMessageSeen(msg.hash)) {
      Storage.setMessageSeen(msg.hash)
      newMessages.push(msg)
    }
  }

  const processedMessages = await Promise.all(
    newMessages.map(async m => {
      const content = extractWebSocketContent(m.data, m.hash)
      if (!content) {
        return null
      }

      const message = { body: content.body, hash: content.messageHash, expiration: m.expiration }
      const envelope = SignalService.Envelope.decode(message.body)

      if (envelope.content && envelope.content.length > 0) {
        const decrypted = await decryptNewMessage(envelope, content.messageHash)
        if(!decrypted) return null
        return {
          ...decrypted,
          from: decrypted?.envelope.source,
          to: decrypted?.content.dataMessage?.syncTarget || undefined,
        }
      } else {
        return null
      }
    })
  )

  const messages = processedMessages.filter(Boolean) as NewMessage[]

  return messages.sort((a, b) => a.sentAtTimestamp - b.sentAtTimestamp)
}

