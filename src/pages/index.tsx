import React from 'react'
import { fetchSnodesList } from '@/shared/api/snodes'
import { generateKeypair, generateMnemonic } from '@/shared/api/account-manager'
import _ from 'lodash'
import * as Storage from '@/shared/api/storage'
import { getNewMessages } from '@/shared/api/messages'
import { LeftPanel } from '@/widgets/left-panel'
import { Separator } from '@/shared/ui/separator'
import { PageWrapper } from '@/widgets/page-wrapper'
import { ResizablePanel } from '@/shared/ui/resizable'

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
    alert('This won\'t work for now, you have to register your account first, please use mnemonic login for now')
  }

  const handlePollKeypair = async () => {
    const messages = await getNewMessages()
    console.log(messages.length + ' new messages')
    for(const msg of messages) {
      console.log('From', msg.content.dataMessage?.profile?.displayName, 'with content', msg.content.dataMessage?.body, 'sent at', msg.content.dataMessage?.timestamp)
    }
  }

  const handleLoginWithMnemonic = async () => {
    const mnemonic = prompt('mnemonic')
    if(!mnemonic) return
    const keypair = await generateKeypair(mnemonic)
    await Storage.setIdentityKeypair(keypair)
  }

  return (
    <PageWrapper>
      <LeftPanel />
      <ResizablePanel>
        <div className="flex items-center px-4 py-2 h-14">
            <h1 className="text-xl font-bold">Inbox</h1>
          </div>
          <Separator />
          {/* <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60"> */}
            {/* <Search /> */}
            {/* <form>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search" className="pl-8" />
              </div>
            </form> */}
          {/* </div> */}
        <div className='flex-1' style={{ display: 'flex', flexDirection: 'column', gap: 2, zoom: 2 }}>
          <button onClick={handleFetchSnodes}>fetch snodes</button>
          <button onClick={handleLoginWithMnemonic}>login with mnemonic</button>
          <button onClick={handleGenerateKeypair}>generate keypair</button>
          <button onClick={handlePollKeypair}>poll keypair</button>
        </div>
      </ResizablePanel>
    </PageWrapper>
  )
}
