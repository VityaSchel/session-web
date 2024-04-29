import { SnodeSignatureResult } from 'types/snode-signature-result'
import { SnodeNamespaces } from '../../../types/namespaces'
import * as SnodeSignature from './snode-signature'

export async function fetchSnodesList() {
  const snodesResponse = await fetch('http://localhost:3000/snodes')
    .then(res => res.json() as Promise<{ ok: true, snodes: string[] } | { ok: false, error: string }>)
  if(snodesResponse.ok)
    return snodesResponse.snodes
  else
    throw new Error(snodesResponse.error)
}

export async function pollSnode({ snode, namespace, pubkey }: {
  snode: string,
  namespace: SnodeNamespaces,
  pubkey: string
}) {
  const signatureBuilt: SnodeSignatureResult = await SnodeSignature.getSnodeSignatureParams({
    method: 'retrieve' as const,
    namespace,
    pubkey
  })
  const pollResult = await fetch('http://localhost:3000/poll_snode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      snode,
      namespace,
      pubkey,
      signatureBuilt
    })
  })
    .then(res => res.json())
  return pollResult.results[0]
}