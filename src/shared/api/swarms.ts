import { getTargetNode } from '@/shared/nodes'

export async function fetchSwarmsFor(pubkey: string) {
  const snodesResponse = await fetch(import.meta.env.VITE_BACKEND_URL + '/swarms?' + new URLSearchParams({
    pubkey,
    snode: await getTargetNode()
  }))
    .then(res => res.json() as Promise<{ ok: true, swarms: string[] } | { ok: false, error: string }>)
  if(snodesResponse.ok)
    return snodesResponse.swarms
  else
    throw new Error(snodesResponse.error)
}