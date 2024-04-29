// CREDIT: OXEN, Session-Desktop
// github.com/oxen-io/session-desktop

import { Snode } from './snodes'
import { SnodeNamespace, SnodeNamespaces } from '../../types/namespaces'
import { RetrieveLegacyClosedGroupSubRequestType, RetrieveSubRequestType } from '../../types/snode-request-types'
import { isArray, omit } from 'lodash'
import { SnodeSignatureResult } from '../../types/snode-signature-result'
import { doSnodeBatchRequest } from './batch-request'
import { GetNetworkTime } from './network-time'

export type RetrieveMessageItem = {
  hash: string;
  expiration: number;
  data: string;
  timestamp: number;
};

export type RetrieveMessagesResultsContent = {
  hf?: Array<number>;
  messages?: Array<RetrieveMessageItem>;
  more: boolean;
  t: number;
};

export type RetrieveRequestResult = {
  code: number;
  messages: RetrieveMessagesResultsContent;
  namespace: SnodeNamespaces;
};

export type RetrieveMessagesResultsBatched = Array<RetrieveRequestResult>;


async function buildRetrieveRequest(
  lastHashes: Array<string>,
  pubkey: string,
  namespaces: Array<SnodeNamespaces>,
  signatureBuilt: SnodeSignatureResult
  // ourPubkey: string,
  // configHashesToBump: Array<string> | null
): Promise<Array<RetrieveSubRequestType>> {
  const maxSizeMap = SnodeNamespace.maxSizeMap(namespaces)
  const retrieveRequestsParams: Array<RetrieveSubRequestType> = await Promise.all(
    namespaces.map(async (namespace, index) => {
      const foundMaxSize = maxSizeMap.find(m => m.namespace === namespace)?.maxSize
      const retrieveParam = {
        pubkey,
        last_hash: lastHashes.at(index) || '',
        namespace,
        timestamp: GetNetworkTime.getNowWithNetworkOffset(),
        max_size: foundMaxSize,
      }

      if (namespace === SnodeNamespaces.ClosedGroupMessage) {
        // if (pubkey === ourPubkey || !pubkey.startsWith('05')) {
        //   throw new Error(
        //     'namespace -10 can only be used to retrieve messages from a legacy closed group (prefix 05)'
        //   )
        // }
        const retrieveLegacyClosedGroup = {
          ...retrieveParam,
          namespace,
        }
        const retrieveParamsLegacy: RetrieveLegacyClosedGroupSubRequestType = {
          method: 'retrieve',
          params: omit(retrieveLegacyClosedGroup, 'timestamp'), // if we give a timestamp, a signature will be required by the service node, and we don't want to provide one as this is an unauthenticated namespace
        }

        return retrieveParamsLegacy
      }

      // all legacy closed group retrieves are unauthenticated and run above.
      // if we get here, this can only be a retrieve for our own swarm, which must be authenticated
      if (
        !SnodeNamespace.isUserConfigNamespace(namespace) &&
        namespace !== SnodeNamespaces.UserMessages
      ) {
        throw new Error(`not a legacy closed group. namespace can only be 0 and was ${namespace}`)
      }
      // if (pubkey !== ourPubkey) {
      //   throw new Error('not a legacy closed group. pubkey can only be ours')
      // }
      // const signatureArgs = { ...retrieveParam, method: 'retrieve' as const, ourPubkey }
      // const signatureBuilt = await SnodeSignature.getSnodeSignatureParams(signatureArgs)
      const retrieve: RetrieveSubRequestType = {
        method: 'retrieve',
        params: { ...retrieveParam, ...signatureBuilt },
      }
      return retrieve
    })
  )

  // if (configHashesToBump?.length) {
  //   const expiry = Date.now() + TTL_DEFAULT.CONFIG_MESSAGE
  //   const signResult = await SnodeSignature.generateUpdateExpirySignature({
  //     shortenOrExtend: '',
  //     timestamp: expiry,
  //     messageHashes: configHashesToBump,
  //   })
  //   if (!signResult) {
  //     console.warn(
  //       `SnodeSignature.generateUpdateExpirySignature returned result empty for hashes ${configHashesToBump}`
  //     )
  //   } else {
  //     const expireParams: UpdateExpiryOnNodeSubRequest = {
  //       method: 'expire',
  //       params: {
  //         messages: configHashesToBump,
  //         pubkey: ourPubkey,
  //         expiry,
  //         signature: signResult.signature,
  //         pubkey_ed25519: signResult.pubkey_ed25519,
  //       },
  //     }

  //     retrieveRequestsParams.push(expireParams)
  //   }
  // }
  return retrieveRequestsParams
}

export async function retrieveNextMessages(
  targetNode: Snode,
  lastHashes: Array<string>,
  associatedWith: string,
  namespaces: Array<SnodeNamespaces>,
  signatureBuilt: SnodeSignatureResult
  // ourPubkey: string,
  // configHashesToBump: Array<string> | null
): Promise<RetrieveMessagesResultsBatched> {
  if (namespaces.length !== lastHashes.length) {
    throw new Error('namespaces and lasthashes does not match')
  }

  const retrieveRequestsParams = await buildRetrieveRequest(
    lastHashes,
    associatedWith,
    namespaces,
    signatureBuilt
    // ourPubkey,
    // configHashesToBump
  )
  // let exceptions bubble up
  // no retry for this one as this a call we do every few seconds while polling for messages
  const timeOutMs = 4 * 1000
  const timeoutPromise = async () => new Promise(resolve => setTimeout(resolve, timeOutMs))
  const fetchPromise = async () =>
    doSnodeBatchRequest(retrieveRequestsParams, targetNode, timeOutMs, associatedWith)

  // just to make sure that we don't hang for more than timeOutMs
  const results = await Promise.race([timeoutPromise(), fetchPromise()])
  if (!results || !isArray(results) || !results.length) {
    console.warn(
      `_retrieveNextMessages - sessionRpc could not talk to ${targetNode.public_ip}:${targetNode.storage_port}`
    )
    throw new Error(
      `_retrieveNextMessages - sessionRpc could not talk to ${targetNode.public_ip}:${targetNode.storage_port}`
    )
  }

  // the +1 is to take care of the extra `expire` method added once user config is released
  if (results.length !== namespaces.length && results.length !== namespaces.length + 1) {
    throw new Error(
      `We asked for updates about ${namespaces.length} messages but got results of length ${results.length}`
    )
  }

  // do a basic check to know if we have something kind of looking right (status 200 should always be there for a retrieve)
  const firstResult = results[0]

  if (firstResult.code !== 200) {
    console.log(firstResult)
    console.warn(`retrieveNextMessages result is not 200 but ${firstResult.code}`)
    throw new Error(
      `_retrieveNextMessages - retrieve result is not 200 with ${targetNode.public_ip}:${targetNode.storage_port} but ${firstResult.code}`
    )
  }

  try {
    // merge results with their corresponding namespaces
    return results.map((result, index) => ({
      code: result.code,
      messages: result.body as RetrieveMessagesResultsContent,
      namespace: namespaces[index],
    }))
  } catch (e) {
    throw new Error(
      `_retrieveNextMessages - exception while parsing json of nextMessage ${targetNode.public_ip}:${targetNode.storage_port}: ${e?.message}`
    )
  }
}