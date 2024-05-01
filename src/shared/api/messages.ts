import { pollSnode } from '@/shared/api/snodes'
import { SnodeNamespaces } from '../../../types/namespaces'
import * as UserUtils from '@/shared/api/utils/User'
import { toHex } from '@/shared/api/utils/String'
import { RetrieveMessageItem } from '../../../types/retrieve-message-item'
import _, { toNumber } from 'lodash'
import * as Storage from './storage'
import * as StringUtils from './utils/String'
import { SignalService } from '@/shared/api/signal-service'
import { toast } from 'sonner'
import { ECKeyPair } from '@/shared/api/eckeypair'
import sodium from 'libsodium-wrappers-sumo'
import { KeyPrefixType, PubKey } from '@/shared/api/pubkey'
import * as GroupUtils from '@/shared/api/utils/Group'
import { concatUInt8Array } from '@/shared/api/crypto'
import { removeMessagePadding } from '@/shared/api/buffer-padding'
import { getAllCachedECKeyPair } from '@/shared/api/closed-groups'

export async function getNewMessages(node: string) {
  const keypair = await UserUtils.getIdentityKeyPair()
  if (!keypair) throw new Error('No identity keypair found')
  const results = await pollSnode({
    snode: node,
    namespace: SnodeNamespaces.UserMessages,
    pubkey: toHex(keypair.pubKey)
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
        return await decryptNewMessage(envelope, content.messageHash)
      } else {
        return null
      }
    })
  )

  const messages = processedMessages.filter(Boolean) as ProcessedMessage[]

  return messages
}

type WebSocketContent = null | {
  body: Uint8Array;
  messageHash: string;
}

export function extractWebSocketContent(
  message: string,
  messageHash: string
): WebSocketContent {
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
    if(error instanceof Error) {
      window?.console?.warn('extractWebSocketContent from message failed with:', error.message)
    }
    return null
  }
}

type ProcessedMessage = {
  envelope: SignalService.Envelope;
  content: SignalService.Content;
  sentAtTimestamp: number;
  hash: string;
}

async function decryptNewMessage(envelope: SignalService.Envelope, hash: string): Promise<ProcessedMessage | null> {
  const plaintext = await decrypt(envelope)
  if (!plaintext) return null
  if (plaintext instanceof ArrayBuffer && plaintext.byteLength === 0) {
    return null
  }
  const sentAtTimestamp = toNumber(envelope.timestamp)
  const content = SignalService.Content.decode(new Uint8Array(plaintext))
  return { envelope, content, sentAtTimestamp, hash }
}

async function decrypt(envelope: SignalService.Envelope): Promise<null | ArrayBuffer> {
  if (envelope.content.byteLength === 0) {
    throw new Error('Received an empty envelope.')
  }

  let plaintext: ArrayBuffer | null = null
  switch (envelope.type) {
    // Only SESSION_MESSAGE and CLOSED_GROUP_MESSAGE are supported
    case SignalService.Envelope.Type.SESSION_MESSAGE:
      plaintext = await decryptEnvelopeWithOurKey(envelope)
      break
    case SignalService.Envelope.Type.CLOSED_GROUP_MESSAGE:
      plaintext = await decryptForClosedGroup(envelope)
      break
    default:
      toast.error('Received an unsupported message from swarm')
  }

  if (!plaintext) {
    return null
  }

  // await updateCacheWithDecryptedContent(envelope, plaintext).catch((error: any) => {
  //   toast.error(
  //     'decrypt failed to save decrypted message contents to cache:',
  //     error && error.stack ? error.stack : error
  //   )
  // })

  return plaintext
}

/**
 * This function is used to decrypt any messages send to our own pubkey.
 * Either messages deposited into our swarm by other people, or messages we sent to ourselves, or config messages stored on the user namespaces.
 * @param envelope the envelope contaning an encrypted .content field to decrypt
 * @returns the decrypted content, or null
 */
export async function decryptEnvelopeWithOurKey(
  envelope: SignalService.Envelope
): Promise<ArrayBuffer | null> {
  try {
    const userX25519KeyPair = await UserUtils.getIdentityKeyPair()

    if (!userX25519KeyPair) {
      throw new Error('Failed to find User x25519 keypair from stage') // noUserX25519KeyPair
    }

    const ecKeyPair = ECKeyPair.fromArrayBuffer(
      userX25519KeyPair.pubKey,
      userX25519KeyPair.privKey
    )

    const retSessionProtocol = await decryptWithSessionProtocol(
      envelope,
      envelope.content,
      ecKeyPair
    )

    const ret = removeMessagePadding(retSessionProtocol)

    return ret.buffer as ArrayBuffer
  } catch (e) {
    toast.warning('decryptWithSessionProtocol for unidentified message throw: ' + (e instanceof Error ? e.message : ''))
    return null
  }
}

async function decryptForClosedGroup(envelope: SignalService.Envelope): Promise<ArrayBuffer | null> {
  // case .closedGroupCiphertext: for ios
  try {
    const hexEncodedGroupPublicKey = envelope.source
    if (!GroupUtils.isClosedGroup(PubKey.cast(hexEncodedGroupPublicKey))) {
      toast.error('Received medium group message for unknown group')
      throw new Error('Invalid group public key') // invalidGroupPublicKey
    }
    const encryptionKeyPairs = await getAllCachedECKeyPair(hexEncodedGroupPublicKey)

    const encryptionKeyPairsCount = encryptionKeyPairs?.length
    if (!encryptionKeyPairs?.length) {
      throw new Error(`No group keypairs for group ${hexEncodedGroupPublicKey}`) // noGroupKeyPair
    }
    // Loop through all known group key pairs in reverse order (i.e. try the latest key pair first (which'll more than
    // likely be the one we want) but try older ones in case that didn't work)
    let decryptedContent: Uint8Array | undefined
    let keyIndex = 0

    // If an error happens in here, we catch it in the inner try-catch
    // When the loop is done, we check if the decryption is a success;
    // If not, we trigger a new Error which will trigger in the outer try-catch
    do {
      try {
        const hexEncryptionKeyPair = encryptionKeyPairs.pop()

        if (!hexEncryptionKeyPair) {
          throw new Error('No more encryption keypairs to try for message.')
        }
        const encryptionKeyPair = ECKeyPair.fromHexKeyPair(hexEncryptionKeyPair)

        // eslint-disable-next-line no-await-in-loop
        decryptedContent = await decryptWithSessionProtocol(
          envelope,
          envelope.content,
          encryptionKeyPair,
          true
        )
        if (decryptedContent?.byteLength) {
          break
        }
        keyIndex++
      } catch (e) {
        console.info(
          `Failed to decrypt closed group with key index ${keyIndex}. We have ${encryptionKeyPairs.length} keys to try left.`
        )
      }
    } while (encryptionKeyPairs.length > 0)

    if (!decryptedContent?.byteLength) {
      throw new Error(
        `Could not decrypt message for closed group with any of the ${encryptionKeyPairsCount} keypairs.`
      )
    }
    if (keyIndex !== 0) {
      console.warn(
        'Decrypted a closed group message with not the latest encryptionkeypair we have'
      )
    }

    return removeMessagePadding(decryptedContent).buffer as ArrayBuffer
  } catch (e) {
    /**
     * If an error happened during the decoding,
     * we trigger a request to get the latest EncryptionKeyPair for this medium group.
     * Indeed, we might not have the latest one used by someone else, or not have any keypairs for this group.
     *
     */

    console.warn('decryptWithSessionProtocol for medium group message throw:', (e instanceof Error ? e.message : ''))
    const groupPubKey = PubKey.cast(envelope.source)

    // IMPORTANT do not remove the message from the cache just yet.
    // We will try to decrypt it once we get the encryption keypair.
    // for that to work, we need to throw an error just like here.
    throw new Error(
      `Waiting for an encryption keypair to be received for group ${groupPubKey.key}`
    )
  }
}

/**
 * This function can be called to decrypt a keypair wrapper for a closed group update
 * or a message sent to a closed group.
 *
 * We do not unpad the result here, as in the case of the keypair wrapper, there is not padding.
 * Instead, it is the caller who needs to removeMessagePadding() the content.
 */
export async function decryptWithSessionProtocol(
  envelope: SignalService.Envelope,
  ciphertextObj: Uint8Array,
  x25519KeyPair: ECKeyPair,
  isClosedGroup?: boolean
): Promise<Uint8Array> {
  const recipientX25519PrivateKey = x25519KeyPair.privateKeyData
  const hex = toHex(new Uint8Array(x25519KeyPair.publicKeyData))

  const recipientX25519PublicKey = PubKey.removePrefixIfNeeded(hex)

  const signatureSize = sodium.crypto_sign_BYTES
  const ed25519PublicKeySize = sodium.crypto_sign_PUBLICKEYBYTES

  // 1. ) Decrypt the message
  const plaintextWithMetadata = sodium.crypto_box_seal_open(
    new Uint8Array(ciphertextObj),
    StringUtils.fromHexToArray(recipientX25519PublicKey),
    new Uint8Array(recipientX25519PrivateKey)
  )
  if (plaintextWithMetadata.byteLength <= signatureSize + ed25519PublicKeySize) {
    toast.error('Decryption failed.')
    throw new Error('Decryption failed.') // throw Error.decryptionFailed;
  }

  // 2. ) Get the message parts
  const signatureStart = plaintextWithMetadata.byteLength - signatureSize
  const signature = plaintextWithMetadata.subarray(signatureStart)
  const pubkeyStart = plaintextWithMetadata.byteLength - (signatureSize + ed25519PublicKeySize)
  const pubkeyEnd = plaintextWithMetadata.byteLength - signatureSize
  const senderED25519PublicKey = plaintextWithMetadata.subarray(pubkeyStart, pubkeyEnd)
  const plainTextEnd = plaintextWithMetadata.byteLength - (signatureSize + ed25519PublicKeySize)
  const plaintext = plaintextWithMetadata.subarray(0, plainTextEnd)

  // 3. ) Verify the signature
  const isValid = sodium.crypto_sign_verify_detached(
    signature,
    concatUInt8Array(plaintext, senderED25519PublicKey, StringUtils.fromHexToArray(recipientX25519PublicKey)),
    senderED25519PublicKey
  )

  if (!isValid) {
    throw new Error('Invalid message signature.')
  }
  // 4. ) Get the sender's X25519 public key
  const senderX25519PublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(senderED25519PublicKey)
  if (!senderX25519PublicKey) {
    toast.error('Failed to convert sender ED25519 public')
    throw new Error('Decryption failed.')
  }

  // set the sender identity on the envelope itself.
  if (isClosedGroup) {
    // eslint-disable-next-line no-param-reassign
    // envelope.senderIdentity = `${KeyPrefixType.standard}${toHex(senderX25519PublicKey)}`
    console.log(`${KeyPrefixType.standard}${toHex(senderX25519PublicKey)}`)
  } else {
    // eslint-disable-next-line no-param-reassign
    envelope.source = `${KeyPrefixType.standard}${toHex(senderX25519PublicKey)}`
  }

  return plaintext
}