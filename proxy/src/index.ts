import bunrest from 'bunrest'
import cors from 'cors'
import { fetchSnodesList } from './snodes'

const server = bunrest()

server.use(cors({
  origin: [/^https?:\/\/localhost/, 'https://session-online.sessionbots.directory/']
}))

server.get('/snodes', async (req, res) => {
  const list = await fetchSnodesList()
  res.status(200).json({
    ok: true,
    nodes: list
  })
})

server.listen(3000, () => {
  console.log('App is listening on port 3000')
})