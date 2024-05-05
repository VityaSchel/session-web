import bunrest from 'bunrest'
import cors from 'cors'
import { Snode, fetchSnodesList, pollSnode } from './snodes'
import { GetNetworkTime } from './network-time'
import { z } from 'zod'
import { SnodeNamespaces } from './types/namespaces'
import _ from 'lodash'
import { getSwarms } from './swarms'
import { sendMessageDataToSnode } from './store-message'
import { RetryWithOtherNode421Error } from './utils/errors'

const server = bunrest()

server.use(cors({
  origin: [/^https?:\/\/localhost/, 'https://session-web.pages.dev']
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
    if(e instanceof RetryWithOtherNode421Error) {
      res.status(421).json({
        ok: false,
        error: 'Retry with another node'
      })
    } else {
      res.status(500).json({
        ok: false,
        error: e.message
      })
      return
    }
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
    sync: z.object({
      pubkey: z.string().length(66),
      data: z.string().min(1),
    })
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
      snode,
      body.data.sync.pubkey,
      body.data.sync.data
    )
    return res.status(200).json(result)
  } catch(e) {
    if(e instanceof RetryWithOtherNode421Error) {
      return res.status(500).json({
        ok: false
      })
    } else {
      return res.status(500).json({
        ok: false,
        error: 'Internal server error'
      })
    }
  }
})

server.get('/ons', async (req, res) => {
  const myHeaders = new Headers()
  myHeaders.append('Content-Type', 'application/json')

  const query = await z.object({
    hash: z.string().length(44).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/)
  }).safeParseAsync(req.query)
  if(!query.success) {
    res.status(400).json({
      ok: false,
      error: 'Invalid request params'
    })
    return
  }

  const nameHash = query.data.hash

  const request = await fetch('http://public-eu.optf.ngo:22023/json_rpc', {
    method: 'POST',
    headers: myHeaders,
    body: JSON.stringify({
      'jsonrpc': '2.0',
      'id': '0',
      'method': 'ons_resolve',
      'params': {
        'name_hash': nameHash,
        'type': 0
      }
    }),
    redirect: 'follow'
  })
  if(request.status !== 200) {
    res.status(500).json({
      ok: false,
      error: 'Internal server error'
    })
    return
  } else {
    const response = await request.json()
    if(response.error) {
      res.status(200).json({
        ok: false,
        error: response.error.message
      })
    } else {
      const encryptedValue = response.result.encrypted_value
      const nonce = response.result.nonce
      res.status(200).json({
        ok: true,
        value: (encryptedValue && nonce) ? encryptedValue + nonce : null
      })
    }
  }
})

server.options('/snodes', (req, res) => { res.status(200).send(true) })
server.options('/network_time', (req, res) => { res.status(200).send(true) })
server.options('/swarms', (req, res) => { res.status(200).send(true) })
server.options('/poll', (req, res) => { res.status(200).send(true) })
server.options('/store', (req, res) => { res.status(200).send(true) })

server.listen(process.env.PORT || 3000, () => {
  console.log('App is listening on port ' + process.env.PORT || 3000)
})