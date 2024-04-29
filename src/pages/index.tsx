import { fetchSnodesList, pollSnode } from '@/shared/api/snodes'
import { generateKeypair, generateMnemonic } from '@/shared/api/account-manager'
import { SnodeNamespaces } from '../../types/namespaces'
import _ from 'lodash'
import { toHex } from '@/shared/api/utils/String'

export function HomePage() {
  const handleFetchSnodes = async () => {
    const snodes = await fetchSnodesList()
    console.log('5 random snodes out of', snodes.length)
    for(let i = 0; i < 5; i ++) {
      const snode = _.sample(snodes)
      console.log(snode)
    }
  }
  
  const handleGenerateKeypair = async () => {
    const mnemonic = await generateMnemonic()
    const keypair = await generateKeypair(mnemonic)
    console.log('pubkey', toHex(keypair.pubKey))
    console.log('privkey', toHex(keypair.privKey))
  }

  const handlePollKeypair = async () => {
    // const node = prompt('nodeip:nodeport')
    // if(!node) return
    // const userPubkey = prompt('our pubkey')
    // if (!userPubkey) return
    // const pubkey = prompt('target pubkey')
    // if (!pubkey) return
    // await pollSnode({
    //   node,
    //   namespaces: [SnodeNamespaces.UserMessages],
    //   pubkey,
    //   userPubkey
    // })
    await pollSnode({
      node: '51.161.152.255:22021',
      namespaces: [SnodeNamespaces.UserMessages],
      pubkey: '05569dcfd40206f427c05715f82c5a20725dffe591ed8b23c11d505fb25d62b005',
      userPubkey: '057aeb66e45660c3bdfb7c62706f6440226af43ec13f3b6f899c1dd4db1b8fce5b'
    })
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, zoom: 2 }}>
        <button onClick={handleFetchSnodes}>fetch snodes</button>
        <button onClick={handleGenerateKeypair}>generate keypair</button>
        <button onClick={handlePollKeypair}>poll keypair</button>
      </div>
    </div>
  )
}
