// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

import { getNowWithNetworkOffset } from '@/shared/api/get-network-time'
import { SignalService } from '@/shared/api/signal-service'
import { isNil, toNumber } from 'lodash'
import { SnodeNamespaces } from '../../../types/namespaces'
import * as MessageEncrypter from './messages-encrypter'
import ByteBuffer from 'bytebuffer'
import { ContentMessage, toRawMessage } from '@/shared/api/messages'
import { toast } from 'sonner'
import { t } from 'i18next'
import { getTargetNode } from '@/shared/nodes'
import { getIdentityKeyPair } from '@/shared/api/storage'
import { toHex } from '@/shared/api/utils/String'

export async function sendMessage(
  destination: string,
  msg: ContentMessage,
  syncMessage: ContentMessage
): Promise<{ ok: true, hash: string, syncHash: string } | { ok: false }> {
  const keypair = getIdentityKeyPair()
  if(!keypair) {
    throw new Error('No identity keypair found')
  }

  const message = toRawMessage(destination, msg, SnodeNamespaces.UserMessages)
  const rawSyncMessage = toRawMessage(destination, syncMessage, SnodeNamespaces.UserMessages)
  const { ttl } = message

  const [encryptedAndWrapped, syncEncryptedAndWrapped] = await encryptMessagesAndWrap([
    {
      destination,
      plainTextBuffer: message.plainTextBuffer,
      namespace: message.namespace,
      ttl,
      identifier: message.identifier,
      isSyncMessage: false
    },
    {
      destination: toHex(keypair.pubKey),
      plainTextBuffer: rawSyncMessage.plainTextBuffer,
      namespace: rawSyncMessage.namespace,
      ttl,
      identifier: rawSyncMessage.identifier,
      isSyncMessage: true
    },
  ])

  const request = await fetch(import.meta.env.VITE_BACKEND_URL + '/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      params: {
        pubkey: message.recipient,
        data64: encryptedAndWrapped.data64,
        ttl,
        timestamp: encryptedAndWrapped.networkTimestamp,
        namespace: encryptedAndWrapped.namespace,
      },
      destination: message.recipient,
      snode: await getTargetNode(),
      sync: {
        pubkey: toHex(keypair?.pubKey),
        data: syncEncryptedAndWrapped.data64
      }
    })
  })

  if (request.status !== 200) {
    toast.error(t('storeMessageError'))
    return { ok: false }
  }

  const response = await request.json() as { ok: true, hash: string, syncHash: string } | { ok: false, error?: string }

  if (response.ok) {
    return { ok: true, hash: response.hash, syncHash: response.syncHash }
  } else {
    if('error' in response) {
      toast.error(response.error)
    }
    return { ok: false }
  }
}



export type StoreOnNodeParams = {
  pubkey: string;
  ttl: number;
  timestamp: number;
  data: string;
  namespace: number;
  // sig_timestamp?: number;
  signature?: string;
  pubkey_ed25519?: string;
};

export type StoreOnNodeParamsNoSig = Pick<
  StoreOnNodeParams,
  'pubkey' | 'ttl' | 'timestamp' | 'ttl' | 'namespace'
> & { data64: string };

type SharedEncryptAndWrap = {
  ttl: number;
  identifier: string;
  isSyncMessage: boolean;
};

type EncryptAndWrapMessage = {
  plainTextBuffer: Uint8Array;
  destination: string;
  namespace: number | null;
} & SharedEncryptAndWrap;

type EncryptAndWrapMessageResults = {
  data64: string;
  networkTimestamp: number;
  data: Uint8Array;
  namespace: number;
} & SharedEncryptAndWrap;

async function encryptMessageAndWrap(
  params: EncryptAndWrapMessage
): Promise<EncryptAndWrapMessageResults> {
  const {
    destination,
    identifier,
    isSyncMessage: syncMessage,
    namespace,
    plainTextBuffer,
    ttl,
  } = params

  const {
    overRiddenTimestampBuffer,
    networkTimestamp,
  } = await overwriteOutgoingTimestampWithNetworkTimestamp({ plainTextBuffer })

  const encryptionBasedOnConversation = SignalService.Envelope.Type.SESSION_MESSAGE
    // TODO: if closed group, use SignalService.Envelope.Type.CLOSED_GROUP_MESSAGE

  const { envelopeType, cipherText } = await MessageEncrypter.encrypt(
    destination,
    overRiddenTimestampBuffer,
    encryptionBasedOnConversation
  )

  const envelope = await buildEnvelope(envelopeType, destination, networkTimestamp, cipherText)

  const data = wrapEnvelope(envelope)
  const data64 = ByteBuffer.wrap(data).toString('base64')

  // override the namespaces if those are unset in the incoming messages
  // right when we upgrade from not having namespaces stored in the outgoing cached messages our messages won't have a namespace associated.
  // So we need to keep doing the lookup of where they should go if the namespace is not set.

  const overridenNamespace = !isNil(namespace)
    ? namespace
    : // TODO: if closed group, use SnodeNamespaces.ClosedGroupMessage
      /*? SnodeNamespaces.ClosedGroupMessage
      : */SnodeNamespaces.UserMessages

  return {
    data64,
    networkTimestamp,
    data,
    namespace: overridenNamespace,
    ttl,
    identifier,
    isSyncMessage: syncMessage,
  }
}

async function encryptMessagesAndWrap(
  messages: Array<EncryptAndWrapMessage>
): Promise<Array<EncryptAndWrapMessageResults>> {
  return Promise.all(messages.map(encryptMessageAndWrap))
}

async function overwriteOutgoingTimestampWithNetworkTimestamp(message: { plainTextBuffer: Uint8Array }) {
  const networkTimestamp = await getNowWithNetworkOffset()

  const { plainTextBuffer } = message
  const contentDecoded = SignalService.Content.decode(plainTextBuffer)

  const { dataMessage, dataExtractionNotification, typingMessage } = contentDecoded
  if (dataMessage && dataMessage.timestamp && toNumber(dataMessage.timestamp) > 0) {
    // this is a sync message, do not overwrite the message timestamp
    if (dataMessage.syncTarget) {
      return {
        overRiddenTimestampBuffer: plainTextBuffer,
        networkTimestamp: toNumber(dataMessage.timestamp),
      }
    }
    dataMessage.timestamp = networkTimestamp
  }
  if (
    dataExtractionNotification &&
    dataExtractionNotification.timestamp &&
    toNumber(dataExtractionNotification.timestamp) > 0
  ) {
    dataExtractionNotification.timestamp = networkTimestamp
  }
  if (typingMessage && typingMessage.timestamp && toNumber(typingMessage.timestamp) > 0) {
    typingMessage.timestamp = networkTimestamp
  }
  const overRiddenTimestampBuffer = SignalService.Content.encode(contentDecoded).finish()
  return { overRiddenTimestampBuffer, networkTimestamp }
}

async function buildEnvelope(
  type: SignalService.Envelope.Type,
  sskSource: string | undefined,
  timestamp: number,
  content: Uint8Array
): Promise<SignalService.Envelope> {
  let source: string | undefined

  if (type === SignalService.Envelope.Type.CLOSED_GROUP_MESSAGE) {
    source = sskSource
  }

  return SignalService.Envelope.create({
    type,
    source,
    timestamp,
    content,
  })
}

/**
 * This is an outdated practice and we should probably just send the envelope data directly.
 * Something to think about in the future.
 */
function wrapEnvelope(envelope: SignalService.Envelope): Uint8Array {
  const request = SignalService.WebSocketRequestMessage.create({
    id: 0,
    body: SignalService.Envelope.encode(envelope).finish(),
    verb: 'PUT',
    path: '/api/v1/message',
  })

  const websocket = SignalService.WebSocketMessage.create({
    type: SignalService.WebSocketMessage.Type.REQUEST,
    request,
  })
  return SignalService.WebSocketMessage.encode(websocket).finish()
}