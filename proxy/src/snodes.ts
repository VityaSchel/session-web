import https from 'https'
import { seeds } from './seeds-certificates'
import tls from 'tls'
import { sha256 } from './crypto'
import nodefetch from 'node-fetch'

export async function fetchSnodesList() {
  const snode = seeds[0]
  const sslAgent = new https.Agent({
    ca: snode.certContent,
    rejectUnauthorized: true,
    keepAlive: true,

    checkServerIdentity: (host: string, cert: tls.PeerCertificate) => {
      const err = tls.checkServerIdentity(host, cert)
      if (err) {
        return err
      }

      if (sha256((cert.pubkey as Buffer).toString()) !== snode.pubkey256) {
        return new Error('Certificate pubkey does not match pinned')
      }

      if (cert.fingerprint256 !== snode.cert256) {
        return new Error('Certificate fingerprint does not match pinned')
      }

      return undefined
    }
  })
  const snodesRequest = await nodefetch(`https://${snode.url}/json_rpc`, {
    headers: {
      'User-Agent': 'WhatsApp', // don't ask, it's a tradition: https://github.com/oxen-io/session-desktop/blob/48a245e13c3b9f99da93fc8fe79dfd5019cd1f0a/ts/session/apis/seed_node_api/SeedNodeAPI.ts#L259
    },
    method: 'POST',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 0,
      method: 'get_n_service_nodes'
    }),
    agent: sslAgent,
  })
  if(!snodesRequest.ok) {
    throw new Error('Failed to fetch snodes')
  }
  const snodesResponse = await snodesRequest.json()
  return snodesResponse.result
}