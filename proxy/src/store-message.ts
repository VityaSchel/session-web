import _, { isEmpty } from 'lodash'
import { DeleteByHashesFromNodeParams, DeleteFromNodeSubRequest, NotEmptyArrayOfBatchResults, StoreOnNodeParams, StoreOnNodeParamsNoSig, StoreOnNodeSubRequest } from '../../types/snode-request-types'
import { Snode } from './snodes'
import { getSwarms } from './swarms'
import { doSnodeBatchRequest } from './batch-request'
import { GetNetworkTime } from './network-time'
import { nodes } from './index'

export async function sendMessageDataToSnode(
  params: StoreOnNodeParamsNoSig,
  destination: string,
  snode: Snode
): Promise<{ ok: true, hash: string } | { ok: false }> {
  const swarms = await getSwarms(destination, snode)
  const swarm = _.sample(swarms)
  if (!swarm) throw new Error('No swarm found')
  const targetSwarm = nodes.get(swarm)
  if (!targetSwarm) throw new Error('Swarm was not in the list of nodes')

  const storeResults = await storeOnNode(
    targetSwarm,
    [{ 
      data: params.data64,
      namespace: params.namespace,
      pubkey: params.pubkey,
      timestamp: params.timestamp,
      ttl: params.ttl
    }],
    null
  )
  const storeResults = await storeOnNode(
    targetSwarm,
    [{ 
      data: params.data64,
      namespace: params.namespace,
      pubkey: params.pubkey,
      timestamp: params.timestamp,
      ttl: params.ttl
    }],
    null
  )

  if(isEmpty(storeResults)) {
    return { ok: false }
  } else {
    return { ok: true, hash: storeResults[0].body.hash }
  }
}

function justStores(params: Array<StoreOnNodeParams>) {
  return params.map(p => {
    return {
      method: 'store',
      params: p,
    } as StoreOnNodeSubRequest
  })
}

function buildStoreRequests(
  params: Array<StoreOnNodeParams>,
  toDeleteOnSequence: DeleteByHashesFromNodeParams | null
): Array<StoreOnNodeSubRequest | DeleteFromNodeSubRequest> {
  if (!toDeleteOnSequence || isEmpty(toDeleteOnSequence)) {
    return justStores(params)
  }
  return [...justStores(params), ...buildDeleteByHashesSubRequest(toDeleteOnSequence)]
}

function buildDeleteByHashesSubRequest(
  params: DeleteByHashesFromNodeParams
): Array<DeleteFromNodeSubRequest> {
  return [
    {
      method: 'delete',
      params,
    },
  ]
}

/**
 * Send a 'store' request to the specified targetNode, using params as argument
 * @returns the Array of stored hashes if it is a success, or null
 */
async function storeOnNode(
  targetNode: Snode,
  params: Array<StoreOnNodeParams>,
  toDeleteOnSequence: DeleteByHashesFromNodeParams | null
): Promise<NotEmptyArrayOfBatchResults> {
  const subRequests = buildStoreRequests(params, toDeleteOnSequence)
  const result = await doSnodeBatchRequest(
    subRequests,
    targetNode,
    4000,
    params[0].pubkey,
    toDeleteOnSequence ? 'sequence' : 'batch'
  )

  if (!result || !result.length) {
    throw new Error('requestSnodesForPubkeyWithTargetNodeRetryable: Invalid result')
  }

  const firstResult = result[0]

  if (firstResult.code !== 200) {
    throw new Error('storeOnNode: Invalid status code')
  }

  GetNetworkTime.handleTimestampOffsetFromNetwork('store', firstResult.body.t)

  return result
}