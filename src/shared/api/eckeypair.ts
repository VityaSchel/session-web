// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

import { fromHexToArray, toHex } from '@/shared/api/utils/String'
import { SessionKeyPairLibsodiumSumo as SessionKeyPair } from 'types/keypairs'

export type HexKeyPair = {
  publicHex: string;
  privateHex: string;
};

export class ECKeyPair {
  public readonly publicKeyData: Uint8Array
  public readonly privateKeyData: Uint8Array

  constructor(publicKeyData: Uint8Array, privateKeyData: Uint8Array) {
    this.publicKeyData = publicKeyData
    this.privateKeyData = privateKeyData
  }

  public static fromArrayBuffer(pub: ArrayBuffer, priv: ArrayBuffer) {
    return new ECKeyPair(new Uint8Array(pub), new Uint8Array(priv))
  }

  public static fromKeyPair(pair: SessionKeyPair) {
    return new ECKeyPair(new Uint8Array(pair.pubKey), new Uint8Array(pair.privKey))
  }

  public static fromHexKeyPair(pair: HexKeyPair) {
    return new ECKeyPair(fromHexToArray(pair.publicHex), fromHexToArray(pair.privateHex))
  }

  public toString() {
    const hexKeypair = this.toHexKeyPair()
    return `ECKeyPair: ${hexKeypair.publicHex} ${hexKeypair.privateHex}`
  }

  public toHexKeyPair(): HexKeyPair {
    const publicHex = toHex(this.publicKeyData)
    const privateHex = toHex(this.privateKeyData)
    return {
      publicHex,
      privateHex,
    }
  }
}
