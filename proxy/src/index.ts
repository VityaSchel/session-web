import bunrest from 'bunrest'
import cors from 'cors'
import { Snode, fetchSnodesList, pollSnode } from './snodes'
import { GetNetworkTime } from './network-time'
import { z } from 'zod'
import { SnodeNamespaces } from '../../types/namespaces'

const server = bunrest()

server.use(cors({
  origin: [/^https?:\/\/localhost/, 'https://session-online.sessionbots.directory/']
}))

const snodes: Map<string, Snode> = new Map()
server.get('/snodes', async (req, res) => {
  const list = await fetchSnodesList()
  list.forEach(node => snodes.set(node.public_ip + ':' + node.storage_port, node))
  res.status(200).json({
    ok: true,
    nodes: list
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
    userPubkey: z.string().min(1),
    namespaces: z.array(z.nativeEnum(SnodeNamespaces)).nonempty(),
    snode: z.string().regex(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}$/)
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

  const namespaces = Array.from(new Set(body.data.namespaces)) as SnodeNamespaces[]

  try {
    const results = await pollSnode({
      node: snode,
      namespaces: namespaces,
      pubkey: body.data.pubkey,
      userPubkey: body.data.userPubkey
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

server.listen(3000, () => {
  console.log('App is listening on port 3000')
})