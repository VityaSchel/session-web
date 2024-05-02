import _, { isEmpty } from 'lodash'
import { DeleteByHashesFromNodeParams, DeleteFromNodeSubRequest, NotEmptyArrayOfBatchResults, StoreOnNodeParams, StoreOnNodeParamsNoSig, StoreOnNodeSubRequest } from './types/snode-request-types'
import { Snode } from './snodes'
import { getSwarms } from './swarms'
import { doSnodeBatchRequest } from './batch-request'
import { GetNetworkTime } from './network-time'
import { nodes } from './index'
import { RetryWithOtherNode421Error } from './utils/errors'
import pRetry from 'p-retry'

export async function sendMessageDataToSnode(
  params: StoreOnNodeParamsNoSig,
  destination: string,
  snode: Snode,
  syncPubKey: string,
  syncData: string
): Promise<{ ok: true, hash: string, syncHash: string } | { ok: false }> {
  const targetSwarms = await getSwarms(destination, snode)
  if (targetSwarms.length === 0) throw new Error('No target swarms found')

  const ourSwarms = await getSwarms(syncPubKey, snode)
  if (ourSwarms.length === 0) throw new Error('No our swarms found')

  const storeResults = await pRetry(async () => {
    const targetSwarm = _.sample(targetSwarms)
    if(!targetSwarm) throw new Error('No available target swarms left')
    const targetSwarmInstance = nodes.get(targetSwarm)
    if (!targetSwarmInstance) throw new Error('Swarm was not in the list of nodes')

    try {
      return await storeOnNode(
        targetSwarmInstance,
        [{ 
          data: params.data64,
          namespace: params.namespace,
          pubkey: params.pubkey,
          timestamp: params.timestamp,
          ttl: params.ttl
        }],
        null
      )
    } catch (e) {
      if (e instanceof RetryWithOtherNode421Error) {
        targetSwarms.splice(targetSwarms.indexOf(targetSwarm), 1)
        console.log('Retrying without', targetSwarm)
      }
      throw e
    }
  }, {
    retries: 5,
    shouldRetry: err => err instanceof RetryWithOtherNode421Error
  })

  if(isEmpty(storeResults)) {
    return { ok: false }
  } else {
    const syncStoreResults = await pRetry(async () => {
      const ourSwarm = _.sample(ourSwarms)
      if(!ourSwarm) throw new Error('No available our swarms left')
      const ourSwarmInstance = nodes.get(ourSwarm)
      if (!ourSwarmInstance) throw new Error('Swarm was not in the list of nodes')

      try {
        return await storeOnNode(
          ourSwarmInstance,
          [{
            data: syncData,
            namespace: params.namespace,
            pubkey: syncPubKey,
            timestamp: params.timestamp,
            ttl: params.ttl
          }],
          null
        )
      } catch(e) {
        if(e instanceof RetryWithOtherNode421Error) {
          ourSwarms.splice(ourSwarms.indexOf(ourSwarm), 1)
          console.log('Retrying without', ourSwarm)
        }
        throw e
      }
    }, {
      retries: 5,
      shouldRetry: err => err instanceof RetryWithOtherNode421Error
    })
    return { ok: true, hash: storeResults[0].body.hash, syncHash: syncStoreResults[0].body.hash }
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
    if (firstResult.code === 421) throw new RetryWithOtherNode421Error()
    throw new Error('storeOnNode: Invalid status code: ' + firstResult.code)
  }

  GetNetworkTime.handleTimestampOffsetFromNetwork('store', firstResult.body.t)

  return result
}