import bunrest from 'bunrest'
import cors from 'cors'
import { Snode, fetchSnodesList, pollSnode } from './snodes'
import { GetNetworkTime } from './network-time'
import { z } from 'zod'
import { SnodeNamespaces } from '../../types/namespaces'
import _ from 'lodash'

const server = bunrest()

server.use(cors({
  origin: [/^https?:\/\/localhost/, 'https://session-online.sessionbots.directory/']
}))

const snodes: Map<string, Snode> = new Map()
server.get('/snodes', async (req, res) => {
  const list = await fetchSnodesList()
  if(GetNetworkTime.getLatestTimestampOffset() === 0) {
    GetNetworkTime.getNetworkTime(_.sample(list)!)
  }
  list.forEach(node => snodes.set(node.public_ip + ':' + node.storage_port, node))
  res.status(200).json({
    ok: true,
    snodes: list.map(node => node.public_ip + ':' + node.storage_port)
  })
})

server.get('/network_time', async (req, res) => {
  const now = GetNetworkTime.getNowWithNetworkOffset()
  res.status(200).json({
    ok: true,
    value: now
  })
})

server.post('/poll_snode', async (req, res) => {
  const body = await z.object({
    pubkey: z.string().min(1),
    namespace: z.nativeEnum(SnodeNamespaces),
    snode: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/),
    signatureBuilt: z.object({
      timestamp: z.number().int().positive(),
      signature: z.string().min(1),
      pubkey_ed25519: z.string().min(1),
      pubkey: z.string().min(1),
    })
  }).safeParseAsync(req.body)

  if(!body.success) {
    res.status(400).json({
      ok: false,
      error: 'Invalid request body'
    })
    return
  }

  const snode = snodes.get(body.data.snode)
  if (!snode) {
    res.status(404).json({
      ok: false,
      error: 'Snode not found'
    })
    return
  }

  try {
    const results = await pollSnode({
      node: snode,
      namespaces: [body.data.namespace],
      pubkey: body.data.pubkey,
      signatureBuilt: body.data.signatureBuilt
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

server.options('/poll_snode', (req, res) => {
  res.status(200).send(true)
})

server.listen(3000, () => {
  console.log('App is listening on port 3000')
})