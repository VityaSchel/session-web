import { fromUInt8ArrayToBase64 } from '@/shared/api/utils/String'
import blake2 from 'blake2b'
import sodium from 'libsodium-wrappers-sumo'
import { toast } from 'sonner'
// import argon2 from 'argon2-browser'
import { t } from 'i18next'

export async function generateOnsHash(unhashed: string) {
  const enc = new TextEncoder()
  return await fromUInt8ArrayToBase64(blake2(32)
    .update(enc.encode(unhashed))
    .digest('binary'))
}

const HEX_STRINGS = '0123456789abcdef'
export function uint8arrayToHex(bytes: Uint8Array) {
  return Array.from(bytes || [])
    .map((b) => HEX_STRINGS[b >> 4] + HEX_STRINGS[b & 15])
    .join('')
}

const ED25519_PUBLIC_KEY_LENGTH = 32
const SESSION_PUBLIC_KEY_BINARY_LENGTH = 1 + ED25519_PUBLIC_KEY_LENGTH
function decryptXChachaWithKey(message: Uint8Array, nonce: Uint8Array, key: Uint8Array) {
  const decBuffer = new Uint8Array(message.byteLength - sodium.crypto_aead_xchacha20poly1305_ietf_ABYTES)
  const result = sodium.crypto_aead_xchacha20poly1305_ietf_decrypt(
    decBuffer,
    message,
    null,
    nonce,
    key
  )
  return uint8arrayToHex(result)
}

function decryptSecretboxWithKey(message: Uint8Array, nonce: Uint8Array, key: Uint8Array) {
  const result = sodium.crypto_secretbox_open_easy(
    message,
    nonce,
    key
  )
  return uint8arrayToHex(result)
}

async function generateKey(unhashedName: string, algorithm: 'blake2b' | 'argon2id13') {
  const enc = new TextEncoder()
  if (algorithm === 'blake2b') {
    const key = blake2(32)
      .update(enc.encode(unhashedName))
      .digest()
    return blake2(32, key)
      .update(enc.encode(unhashedName))
      .digest()
  } else {
    // const crypto_pwhash_SALTBYTES = 16
    // const crypto_pwhash_MEMLIMIT_MODERATE = 268435456
    // const crypto_pwhash_OPSLIMIT_MODERATE = 3
    // const crypto_aead_xchacha20poly1305_ietf_KEYBYTES = 32
    // const OLD_ENC_SALT = new Uint8Array(crypto_pwhash_SALTBYTES)
    // const result = await argon2.hash({
    //   pass: unhashedName,
    //   salt: OLD_ENC_SALT,
    //   time: crypto_pwhash_OPSLIMIT_MODERATE,
    //   mem: crypto_pwhash_MEMLIMIT_MODERATE / 1024,
    //   hashLen: crypto_aead_xchacha20poly1305_ietf_KEYBYTES,
    //   parallelism: 1,
    //   type: argon2.ArgonType.Argon2id
    // })
    // return result.hash
    toast.error(t('unsupportedLegacyOns'))
  }
}

function splitEncryptedValue(encryptedValue: Uint8Array, legacyFormat: boolean): [Uint8Array, Uint8Array] {
  if (legacyFormat) {
    return [encryptedValue, new Uint8Array(sodium.crypto_secretbox_NONCEBYTES)]
  } else {
    const messageLength = encryptedValue.length - sodium.crypto_aead_xchacha20poly1305_ietf_NPUBBYTES
    const nonce = encryptedValue.subarray(messageLength)
    const message = encryptedValue.subarray(0, messageLength)
    return [message, nonce]
  }
}

const MAP_HEX = {
  0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6,
  7: 7, 8: 8, 9: 9, a: 10, b: 11, c: 12, d: 13,
  e: 14, f: 15, A: 10, B: 11, C: 12, D: 13,
  E: 14, F: 15
}
function hexToUint8array(hexString: string): Uint8Array {
  const bytes = new Uint8Array(Math.floor((hexString || '').length / 2))
  let i
  for (i = 0; i < bytes.length; i++) {
    const a = MAP_HEX[hexString[i * 2] as keyof typeof MAP_HEX]
    const b = MAP_HEX[hexString[i * 2 + 1] as keyof typeof MAP_HEX]
    if (a === undefined || b === undefined) {
      break
    }
    bytes[i] = (a << 4) | b
  }
  return i === bytes.length ? bytes : bytes.slice(0, i)
}

export async function decryptONSValue(value: string, unhashedName: string) {
  const encryptedValue = hexToUint8array(value)
  const legacyFormat = encryptedValue.length === SESSION_PUBLIC_KEY_BINARY_LENGTH + sodium.crypto_secretbox_MACBYTES
  try {
    const key = await generateKey(unhashedName, legacyFormat ? 'argon2id13' : 'blake2b') as Uint8Array
    const [message, nonce] = splitEncryptedValue(encryptedValue, legacyFormat)
    if (legacyFormat) {
      return null
      // return decryptSecretboxWithKey(message, nonce, key)
    } else {
      return decryptXChachaWithKey(message, nonce, key)
    }
  } catch (e) {
    if (e instanceof Error && e.message === 'could not verify data') {
      return null
    } else {
      throw e
    }
  }
}