import { KeyPair as LibsodiumSumoKeyPair } from 'libsodium-wrappers-sumo'

export type SessionKeyPair = {
  /**
   * The curve25519 pubkey with prepended 5
   */
  pubKey: ArrayBufferLike;

  /**
   * The curve25519 secret key
   */
  privKey: ArrayBufferLike;

  ed25519KeyPair: KeyPair;
};

export interface KeyPair {
  keyType: KeyType;
  privateKey: Uint8Array;
  publicKey: Uint8Array;
}

export type SessionKeyPairLibsodiumSumo = {
  /**
   * The curve25519 pubkey with prepended 5
   */
  pubKey: ArrayBuffer;

  /**
   * The curve25519 secret key
   */
  privKey: ArrayBuffer;

  ed25519KeyPair: LibsodiumSumoKeyPair;
}