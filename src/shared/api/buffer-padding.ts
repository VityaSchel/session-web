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