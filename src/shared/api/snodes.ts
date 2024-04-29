import { SnodeNamespaces } from '../../../types/namespaces'

export async function fetchSnodesList() {
  const snodesResponse = await fetch('http://localhost:3000/snodes')
    .then(res => res.json() as Promise<{ ok: true, snodes: string[] } | { ok: false, error: string }>)
  if(snodesResponse.ok)
    return snodesResponse.snodes
  else
    throw new Error(snodesResponse.error)
}

export async function pollSnode({ node, namespaces, pubkey, userPubkey }: {
  node: string,
  namespaces: SnodeNamespaces[],
  pubkey: string,
  userPubkey: string
}) {
  const pollResult = await fetch('http://localhost:3000/poll_snode', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ node, namespaces, pubkey, userPubkey })
  })
    .then(res => res.json())
  return pollResult
}