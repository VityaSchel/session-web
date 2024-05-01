import { fetchSnodesList } from '@/shared/api/snodes'
import { fetchSwarmsFor } from '@/shared/api/swarms'
import { getIdentityKeyPair } from '@/shared/api/storage'
import { toHex } from '@/shared/api/utils/String'
import _ from 'lodash'
import { toast } from 'sonner'

let targetNode: string | undefined
let snodes: string[] = []
let targetSwarm: string | undefined
let swarms: string[] = []

export function setTargetNode(newTargetNode: string) {
  targetNode = newTargetNode
}

export async function getTargetNode(): Promise<string> {
  if (!targetNode) {
    snodes = await fetchSnodesList()
    if (snodes.length === 0) {
      toast.error('No snodes available')
      throw new Error('No snodes available')
    }
    targetNode = _.sample(snodes) as string
    setTargetNode(targetNode)
  }
  return targetNode
}


export function setTargetSwarm(newTargetSwarm: string) {
  targetSwarm = newTargetSwarm
}

export async function getTargetSwarm(): Promise<string> {
  const keypair = getIdentityKeyPair()
  if (!keypair) throw new Error('No identity keypair found')
  if (!targetSwarm) {
    swarms = await fetchSwarmsFor(toHex(keypair.pubKey))
    if (swarms.length === 0) {
      toast.error('No swarms available')
      throw new Error('No swarms available')
    }
    targetSwarm = _.sample(swarms) as string
    setTargetSwarm(targetSwarm)
  }
  return targetSwarm
}