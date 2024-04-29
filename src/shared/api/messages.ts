import { pollSnode } from '@/shared/api/snodes'
import { SnodeNamespaces } from '../../../types/namespaces'
import * as UserUtils from '@/shared/api/utils/User'
import { toHex } from '@/shared/api/utils/String'
import { RetrieveMessageItem } from '../../../types/retrieve-message-item'
import _ from 'lodash'
import * as Storage from './storage'
import * as StringUtils from './utils/String'

export async function getMessages() {
  const keypair = await UserUtils.getIdentityKeyPair()
  if (!keypair) return
  const results = await pollSnode({
    snode: '167.86.86.177:22021',//_.sample(snodes) as string,
    namespace: SnodeNamespaces.UserMessages,
    pubkey: toHex(keypair.pubKey)
  })
  const messages = _.uniqBy(results.messages.messages as RetrieveMessageItem[], x => x.hash)
  
  const newMessages = messages.filter(m => {
    if(!Storage.isMessageSeen(m.hash)) {
      Storage.setMessageSeen(m.hash)
      return true
    } else {
      return false
    }
  })

  newMessages.forEach(m => {
    const content = extractWebSocketContent(m.data, m.hash)
    if (!content) {
      return
    }

    
  })
}

export function extractWebSocketContent(
  message: string,
  messageHash: string
): null | {
  body: Uint8Array;
  messageHash: string;
} {
  try {
    const dataPlaintext = new Uint8Array(StringUtils.encode(message, 'base64'))
    const messageBuf = SignalService.WebSocketMessage.decode(dataPlaintext)
    if (
      messageBuf.type === SignalService.WebSocketMessage.Type.REQUEST &&
      messageBuf.request?.body?.length
    ) {
      return {
        body: messageBuf.request.body,
        messageHash,
      }
    }
    return null
  } catch (error) {
    window?.log?.warn('extractWebSocketContent from message failed with:', error.message)
    return null
  }
}