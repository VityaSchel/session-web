import { last } from 'lodash'
import { SnodeNamespaces } from '../../types/namespaces'
import { seeds } from './seeds-certificates'
import * as SnodeAPIRetrieve from './snode-api-retrieve'
import { ed25519Str } from './onion-path'
import { SnodeSignatureResult } from '../../types/snode-signature-result'

export type Snode = {
  public_ip: string
  storage_port: number
  pubkey_x25519: string
  pubkey_ed25519: string
}

export async function fetchSnodesList() {
  const snode = seeds[0]
  const snodesRequest = await fetch(`https://${snode.url}/json_rpc`, {
    headers: {
      'User-Agent': 'WhatsApp', // don't ask, it's a tradition: https://github.com/oxen-io/session-desktop/blob/48a245e13c3b9f99da93fc8fe79dfd5019cd1f0a/ts/session/apis/seed_node_api/SeedNodeAPI.ts#L259
    },
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 0,
      method: 'get_n_service_nodes',
      params: {
        fields: {
          'public_ip': true,
          'storage_port': true,
          'pubkey_x25519': true,
          'pubkey_ed25519': true
        }
      }
    }),
    tls: {
      rejectUnauthorized: false
    }
  })
  if(!snodesRequest.ok) {
    throw new Error('Failed to fetch snodes')
  }
  const snodesResponse = await snodesRequest.json()
  const snodes = (snodesResponse.result.service_node_states as Snode[])
    .filter(snode => snode.public_ip !== '0.0.0.0')
  return snodes
}

// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

export async function pollSnode({ node, namespaces, pubkey, signatureBuilt }: {
  node: Snode,
  pubkey: string,
  signatureBuilt: SnodeSignatureResult
  namespaces: SnodeNamespaces[]
}): Promise<SnodeAPIRetrieve.RetrieveMessagesResultsBatched | null> {
  const namespaceLength = namespaces.length
  if (namespaceLength <= 0) {
    throw new Error(`invalid number of retrieve namespace provided: ${namespaceLength}`)
  }
  const snodeEdkey = node.pubkey_ed25519
  const pkStr = pubkey

  try {
    const prevHashes = await Promise.all(
      namespaces.map(() => '')
    )
    const configHashesToBump: Array<string> = []

    let results = await SnodeAPIRetrieve.retrieveNextMessages(
      node,
      prevHashes,
      pkStr,
      namespaces,
      signatureBuilt
      // pubkey,
      // configHashesToBump
    )

    if (!results.length) {
      return []
    }
    // NOTE when we asked to extend the expiry of the config messages, exclude it from the list of results as we do not want to mess up the last hash tracking logic
    if (configHashesToBump.length) {
      try {
        const lastResult = results[results.length - 1]
        if (lastResult?.code !== 200) {
          // the update expiry of our config messages didn't work.
          console.warn(
            `the update expiry of our tracked config hashes didn't work: ${JSON.stringify(
              lastResult
            )}`
          )
        }
      } catch (e) {
        // nothing to do I suppose here.
      }
      results = results.slice(0, results.length - 1)
    }

    const lastMessages = results.map(r => {
      return last(r.messages.messages)
    })

    console.info(
      `updating last hashes for ${ed25519Str(pubkey)}: ${ed25519Str(snodeEdkey)}  ${lastMessages.map(m => m?.hash || '')}`
    )
    await Promise.all(
      lastMessages.map(async (lastMessage, index) => {
        if (!lastMessage) {
          return undefined
        }
        // return updateLastHash({
        //   edkey: snodeEdkey,
        //   pubkey,
        //   namespace: namespaces[index],
        //   hash: lastMessage.hash,
        //   expiration: lastMessage.expiration,
        // })
      })
    )

    return results
  } catch (e) {
    if (e.message === ERROR_CODE_NO_CONNECT) {
      console.error('Server is offline')
    }
    console.info('pollNodeForKey failed with:', e.message)
    return null
  }
}

// async function updateLastHash({
//   edkey,
//   expiration,
//   hash,
//   namespace,
//   pubkey,
// }: {
//   edkey: string;
//   pubkey: PubKey;
//   namespace: number;
//   hash: string;
//   expiration: number;
// }): Promise<void> {
//   const pkStr = pubkey.key
//   const cached = await this.getLastHash(edkey, pubkey.key, namespace)

//   if (!cached || cached !== hash) {
//     await Data.updateLastHash({
//       convoId: pkStr,
//       snode: edkey,
//       hash,
//       expiresAt: expiration,
//       namespace,
//     })
//   }

//   if (!this.lastHashes[edkey]) {
//     this.lastHashes[edkey] = {}
//   }
//   if (!this.lastHashes[edkey][pkStr]) {
//     this.lastHashes[edkey][pkStr] = {}
//   }
//   this.lastHashes[edkey][pkStr][namespace] = hash
// }

// async function getLastHash(nodeEdKey: string, pubkey: string, namespace: number): Promise<string> {
//   if (!this.lastHashes[nodeEdKey]?.[pubkey]?.[namespace]) {
//     const lastHash = await Data.getLastHashBySnode(pubkey, nodeEdKey, namespace)

//     if (!this.lastHashes[nodeEdKey]) {
//       this.lastHashes[nodeEdKey] = {}
//     }

//     if (!this.lastHashes[nodeEdKey][pubkey]) {
//       this.lastHashes[nodeEdKey][pubkey] = {}
//     }
//     this.lastHashes[nodeEdKey][pubkey][namespace] = lastHash || ''
//     return this.lastHashes[nodeEdKey][pubkey][namespace]
//   }
//   // return the cached value
//   return this.lastHashes[nodeEdKey][pubkey][namespace]
// }

export const ERROR_CODE_NO_CONNECT = 'ENETUNREACH: No network connection.'