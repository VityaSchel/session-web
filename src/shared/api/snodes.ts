import { SnodeSignatureResult } from 'types/snode-signature-result'
import { SnodeNamespaces } from '../../../types/namespaces'
import * as SnodeSignature from './snode-signature'

export async function fetchSnodesList() {
  const snodesResponse = await fetch(import.meta.env.VITE_BACKEND_URL + '/snodes')
    .then(res => res.json() as Promise<{ ok: true, snodes: string[] } | { ok: false, error: string }>)
  if(snodesResponse.ok)
    return snodesResponse.snodes
  else
    throw new Error(snodesResponse.error)
}

export async function pollSnode({ swarm, namespace, pubkey, lastHash }: {
  swarm: string,
  namespace: SnodeNamespaces,
  pubkey: string
  lastHash?: string
}) {
  const signatureBuilt: SnodeSignatureResult = await SnodeSignature.getSnodeSignatureParams({
    method: 'retrieve' as const,
    namespace,
    pubkey
  })
  const pollResult = await fetch(import.meta.env.VITE_BACKEND_URL + '/poll', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      swarm,
      namespace,
      pubkey,
      signatureBuilt,
      ...(lastHash && { last_hash: lastHash })
    })
  })
    .then(res => res.json())
  return pollResult.results[0]
}