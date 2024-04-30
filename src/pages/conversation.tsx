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

export function ConversationPage() {

  return (
    <PageWrapper>
      <LeftPanel />
      <ResizablePanel>
        <div className="flex items-center px-4 py-2 h-14">
          <h1 className="text-xl font-bold">Conversation</h1>
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
        <div className='flex-1'>
          test
        </div>
      </ResizablePanel>
    </PageWrapper>
  )
}
