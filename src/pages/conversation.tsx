import React from 'react'
import * as Storage from '@/shared/api/storage'
import { LeftPanel } from '@/widgets/left-panel'
import { Separator } from '@/shared/ui/separator'
import { PageWrapper } from '@/widgets/page-wrapper'
import { ResizablePanel } from '@/shared/ui/resizable'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppSelector } from '@/shared/store/hooks'
import { selectAccount } from '@/shared/store/slices/account'
import { formatSessionID } from '@/shared/utils'
import { Conversation } from '@/widgets/conversation'

export function ConversationPage() {
  const account = useAppSelector(selectAccount)
  const conversationID = useParams().id
  const navigate = useNavigate()

  React.useEffect(() => {
    async function getConversation() {
      if (!account) return

      if (!await Storage.db.conversations.where({ id: conversationID, accountSessionID: account.sessionID })) {
        navigate('/')
      } else {
        
        const messages = await Storage.db.messages.where({ conversationID, accountSessionID: account.sessionID, read: Number(false) as 0 | 1 }).primaryKeys()
        await Storage.db.messages.bulkUpdate(messages.map(hash => ({
          key: hash,
          changes: {
            read: Number(true) as 0 | 1
          }
        })))
      }
    }

    getConversation()
  }, [conversationID, navigate, account])

  const conversation = useLiveQuery(() => Storage.db.conversations.get(conversationID), [conversationID])

  return (
    <div className='flex flex-col flex-1 h-full'>
      <div className="flex items-center px-4 py-2 h-14 shrink-0">
        <h1 className="text-xl font-bold">
          {conversation && (conversation.displayName || formatSessionID(conversation.id, 'long'))}
        </h1>
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
      <div className='overflow-auto flex-1'>
        {conversationID !== undefined && <Conversation conversationID={conversationID} />}
      </div>
    </div>
  )
}
