import { doSnodeBatchRequest } from './batch-request'
import { Snode } from './snodes'

export async function getSwarms(pubkey: string, node: Snode): Promise<string[]> {
  const result = await doSnodeBatchRequest([{
    method: 'get_swarm',
    params: {
      pubkey: pubkey,
    },
  }], node, 10000, null)
  const swarms = result[0].body.snodes
  return swarms.map((swarm: { ip: string, port: string }) => swarm.ip + ':' + swarm.port)
}