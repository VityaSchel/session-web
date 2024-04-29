import React from 'react'
import { fetchSnodesList } from '@/shared/api/snodes'
import { generateKeypair, generateMnemonic } from '@/shared/api/account-manager'
import _ from 'lodash'
import { toHex } from '@/shared/api/utils/String'
import * as Storage from '@/shared/api/storage'
import { getMessages } from '@/shared/api/messages'

export function HomePage() {
  const [snodes, setSnodes] = React.useState<string[]>([])

  const handleFetchSnodes = async () => {
    const snodes = await fetchSnodesList()
    console.log('5 random snodes out of', snodes.length)
    for(let i = 0; i < 5; i ++) {
      const snode = _.sample(snodes)
      console.log(snode)
    }
    setSnodes(snodes)
  }
  
  const handleGenerateKeypair = async () => {
    const mnemonic = await generateMnemonic()
    const keypair = await generateKeypair(mnemonic)
    await Storage.setIdentityKeypair(keypair)
    console.log('pubkey', toHex(keypair.pubKey))
    console.log('privkey', toHex(keypair.privKey))
  }

  const handlePollKeypair = async () => {
    // const snode = prompt('nodeip:nodeport')
    // if(!snode) return
    // const userPubkey = prompt('our pubkey')
    // if (!userPubkey) return
    // const pubkey = prompt('target pubkey')
    // if (!pubkey) return
    // await pollSnode({
    //   snode,
    //   namespaces: [SnodeNamespaces.UserMessages],
    //   pubkey,
    //   userPubkey
    // })
    await getMessages()
  }

  const handleLoginWithMnemonic = async () => {
    const mnemonic = 'gadget academy batch shackles tirade yesterday unwind tuesday tanks usage vortex irate usage'//prompt('mnemonic')
    if(!mnemonic) return
    const keypair = await generateKeypair(mnemonic)
    await Storage.setIdentityKeypair(keypair)
    console.log('pubkey', toHex(keypair.pubKey))
    console.log('privkey', toHex(keypair.privKey))
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, zoom: 2 }}>
        <button onClick={handleFetchSnodes}>fetch snodes</button>
        <button onClick={handleLoginWithMnemonic}>login with mnemonic</button>
        <button onClick={handleGenerateKeypair}>generate keypair</button>
        <button onClick={handlePollKeypair}>poll keypair</button>
      </div>
    </div>
  )
}
