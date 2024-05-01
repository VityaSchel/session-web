import bunrest from 'bunrest'
import cors from 'cors'
import { Snode, fetchSnodesList, pollSnode } from './snodes'
import { GetNetworkTime } from './network-time'
import { z } from 'zod'
import { SnodeNamespaces } from '../../types/namespaces'
import _ from 'lodash'
import { getSwarms } from './swarms'
import { sendMessageDataToSnode } from './store-message'

const server = bunrest()

server.use(cors({
  origin: [/^https?:\/\/localhost/, 'https://session-online.sessionbots.directory/']
}))

export const nodes: Map<string, Snode> = new Map()

const fetchSnodes = async () => {
  const list = await fetchSnodesList()
  GetNetworkTime.getNetworkTime(_.sample(list)!)
  list.forEach(node => nodes.set(node.public_ip + ':' + node.storage_port, node))
}
await fetchSnodes() 
setInterval(fetchSnodes, 1000 * 60 * 5)

server.get('/snodes', async (req, res) => {
  res.status(200).json({
    ok: true,
    snodes: Array.from(nodes.values()).map(node => node.public_ip + ':' + node.storage_port)
  })
})

server.get('/network_time', async (req, res) => {
  const now = GetNetworkTime.getNowWithNetworkOffset()
  res.status(200).json({
    ok: true,
    value: now
  })
})

server.get('/swarms', async (req, res) => {
  const query = await z.object({
    pubkey: z.string().length(66),
    snode: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/),
  }).safeParseAsync(req.query)

  if (!query.success) {
    res.status(400).json({
      ok: false,
      error: 'Invalid request query'
    })
    return
  }

  const snode = nodes.get(query.data.snode)
  if (!snode) {
    res.status(404).json({
      ok: false,
      error: 'Swarm not found'
    })
    return
  }

  try {
    const swarms = await getSwarms(query.data.pubkey, snode)
    res.status(200).json({
      ok: true,
      swarms
    })
  } catch(e) {
    res.status(500).json({
      ok: false,
      error: 'Internal server error'
    })
  }
})

server.post('/poll', async (req, res) => {
  const body = await z.object({
    pubkey: z.string().min(1),
    namespace: z.nativeEnum(SnodeNamespaces),
    swarm: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/),
    signatureBuilt: z.object({
      timestamp: z.number().int().positive(),
      signature: z.string().min(1),
      pubkey_ed25519: z.string().min(1),
      pubkey: z.string().min(1),
    }),
    last_hash: z.string().min(1).optional(),
  }).safeParseAsync(req.body)

  if(!body.success) {
    res.status(400).json({
      ok: false,
      error: 'Invalid request body'
    })
    return
  }

  const swarm = nodes.get(body.data.swarm)
  if (!swarm) {
    res.status(404).json({
      ok: false,
      error: 'Swarm not found'
    })
    return
  }

  const lastHash = body.data.last_hash

  try {
    const results = await pollSnode({
      node: swarm,
      namespaces: [body.data.namespace],
      pubkey: body.data.pubkey,
      signatureBuilt: body.data.signatureBuilt,
      ...(lastHash && { lastHashes: [lastHash] })
    })
    res.status(200).json({
      ok: true,
      results: results
    })
    return
  } catch(e) {
    res.status(500).json({
      ok: false,
      error: e.message
    })
    return
  }
})

server.post('/store', async (req, res) => {
  const body = await z.object({
    destination: z.string().length(66),
    params: z.object({
      pubkey: z.string().length(66),
      ttl: z.number().int().positive(),
      timestamp: z.number().int().positive(),
      data64: z.string().min(1),
      namespace: z.nativeEnum(SnodeNamespaces),
    }),
    snode: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/),
  }).safeParseAsync(req.body)
  if(!body.success) {
    res.status(400).json({
      ok: false,
      error: 'Invalid request body'
    })
    return
  }

  const snode = nodes.get(body.data.snode)
  if (!snode) {
    res.status(404).json({
      ok: false,
      error: 'Snode not found'
    })
    return
  }

  try {
    const result = await sendMessageDataToSnode(
      body.data.params,
      body.data.destination,
      snode
    )
    return res.status(200).json(result)
  } catch(e) {
    console.error(e)
    return res.status(500).json({
      ok: false,
      error: 'Internal server error'
    })
  }
})

server.options('/poll', (req, res) => { res.status(200).send(true) })
server.options('/store', (req, res) => { res.status(200).send(true) })

server.listen(3000, () => {
  console.log('App is listening on port 3000')
})