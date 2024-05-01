// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

/**
 * This file is used to pad message buffer and attachments
 */
const PADDING_BYTE = 0x00

/**
 * Unpad the buffer from its padding.
 * An error is thrown if there is no padding.
 * A padded buffer is
 *  * whatever at start
 *  * ends with 0x80 and any number of 0x00 until the end
 */
export function removeMessagePadding(paddedPlaintext: Uint8Array): Uint8Array {
  for (let i = paddedPlaintext.length - 1; i >= 0; i -= 1) {
    if (paddedPlaintext[i] === 0x80) {
      const plaintext = new Uint8Array(i)
      plaintext.set(paddedPlaintext.subarray(0, i))
      return plaintext
    }
    if (paddedPlaintext[i] !== PADDING_BYTE) {
      return paddedPlaintext
    }
  }

  throw new Error('Invalid padding')
}

/**
 * Add padding to a message buffer
 * @param messageBuffer The buffer to add padding to.
 */
export function addMessagePadding(messageBuffer: Uint8Array): Uint8Array {
  // window?.log?.info('Adding message padding...');

  const plaintext = new Uint8Array(getPaddedMessageLength(messageBuffer.byteLength + 1) - 1)
  plaintext.set(new Uint8Array(messageBuffer))
  plaintext[messageBuffer.byteLength] = 0x80

  return plaintext
}

function getPaddedMessageLength(originalLength: number): number {
  const messageLengthWithTerminator = originalLength + 1
  let messagePartCount = Math.floor(messageLengthWithTerminator / 160)

  if (messageLengthWithTerminator % 160 !== 0) {
    messagePartCount += 1
  }

  return messagePartCount * 160
}