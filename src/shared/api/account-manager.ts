// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

import { fromHex, toHex } from './utils/String'
import { mnDecode, mnEncode } from './mnemonic-manager'
import sodium from 'libsodium-wrappers-sumo'
import { SessionKeyPairLibsodiumSumo as SessionKeyPair } from '../../../types/keypairs'

/**
 * Might throw
 */
function sessionGenerateKeyPair(seed: ArrayBuffer): SessionKeyPair {
  const ed25519KeyPair = sodium.crypto_sign_seed_keypair(new Uint8Array(seed))
  const x25519PublicKey = sodium.crypto_sign_ed25519_pk_to_curve25519(ed25519KeyPair.publicKey)
  // prepend version byte (coming from `processKeys(raw_keys)`)
  const origPub = new Uint8Array(x25519PublicKey)
  const prependedX25519PublicKey = new Uint8Array(33)
  prependedX25519PublicKey.set(origPub, 1)
  prependedX25519PublicKey[0] = 5
  const x25519SecretKey = sodium.crypto_sign_ed25519_sk_to_curve25519(ed25519KeyPair.privateKey)

  // prepend with 05 the public key
  const x25519KeyPair = {
    pubKey: prependedX25519PublicKey.buffer as ArrayBuffer,
    privKey: x25519SecretKey.buffer as ArrayBuffer,
    ed25519KeyPair,
  }

  return x25519KeyPair
}

export const generateKeypair = (
  mnemonic: string,
  mnemonicLanguage?: string
): SessionKeyPair => {
  let seedHex = mnDecode(mnemonic, mnemonicLanguage)
  // handle shorter than 32 bytes seeds
  const privKeyHexLength = 32 * 2
  if (seedHex.length !== privKeyHexLength) {
    seedHex = seedHex.concat('0'.repeat(32))
    seedHex = seedHex.substring(0, privKeyHexLength)
  }
  const seed = fromHex(seedHex)
  return sessionGenerateKeyPair(seed)
}

export function generateMnemonic() {
  // Note: 4 bytes are converted into 3 seed words, so length 12 seed words
  // (13 - 1 checksum) are generated using 12 * 4 / 3 = 16 bytes.
  const seedSize = 16
  const seed = sodium.randombytes_buf(seedSize)
  const hex = toHex(seed)
  return mnEncode(hex)
}