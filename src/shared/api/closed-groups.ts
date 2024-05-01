// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

import { HexKeyPair } from '@/shared/api/eckeypair'
import * as Storage from '@/shared/api/storage'

// this is a cache of the keypairs stored in the db.
const cacheOfClosedGroupKeyPairs: Map<string, Array<HexKeyPair>> = new Map()

export async function getAllCachedECKeyPair(groupPubKey: string) {
  let keyPairsFound = cacheOfClosedGroupKeyPairs.get(groupPubKey)

  if (!keyPairsFound || keyPairsFound.length === 0) {
    keyPairsFound = (await Storage.getAllEncryptionKeyPairsForGroup(groupPubKey)) || []
    cacheOfClosedGroupKeyPairs.set(groupPubKey, keyPairsFound)
  }

  return keyPairsFound.slice()
}