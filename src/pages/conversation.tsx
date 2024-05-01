import * as Storage from '@/shared/api/storage'
import { LeftPanel } from '@/widgets/left-panel'
import { Separator } from '@/shared/ui/separator'
import { PageWrapper } from '@/widgets/page-wrapper'
import { ResizablePanel } from '@/shared/ui/resizable'
import { useLiveQuery } from 'dexie-react-hooks'
import { useParams } from 'react-router-dom'
import { useAppSelector } from '@/shared/store/hooks'
import { selectAccount } from '@/shared/store/slices/account'

export function ConversationPage() {
  const account = useAppSelector(selectAccount)
  const conversationID = useParams().id
  const messages = useLiveQuery(() => account
    ? Storage.db.messages.where({ accountSessionID: account.sessionID, conversationID }).toArray()
    : [], 
    [account, conversationID]
  )

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
        <div className='flex flex-col flex-1 p-4 gap-1'>
          {messages?.map(msg => (
            <div key={msg.hash} className='flex gap-2'>
              <span>{Intl.DateTimeFormat('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                month: 'numeric',
                day: 'numeric',
                year: 'numeric'
              }).format(msg.timestamp)}</span>
              <div>{msg.textContent}</div>
            </div>
          ))}
        </div>
      </ResizablePanel>
    </PageWrapper>
  )
}
