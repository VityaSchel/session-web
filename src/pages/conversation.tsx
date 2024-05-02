import React from 'react'
import * as Storage from '@/shared/api/storage'
import { Separator } from '@/shared/ui/separator'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate, useParams } from 'react-router-dom'
import { useAppSelector } from '@/shared/store/hooks'
import { selectAccount } from '@/shared/store/slices/account'
import { formatSessionID } from '@/shared/utils'
import { Conversation, ConversationRef } from '@/widgets/conversation'
import { ConversationMessageInput } from '@/features/conversation-message-input'

export function ConversationPage() {
  const account = useAppSelector(selectAccount)
  const conversationID = useParams().id
  const navigate = useNavigate()
  const conversationRef = React.useRef<ConversationRef>(null)

  React.useEffect(() => {
    async function getConversation() {
      if (!account) return

      if (!await Storage.db.conversations.get({ sessionID: conversationID, accountSessionID: account.sessionID })) {
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

  const conversation = useLiveQuery(() => account
    ? Storage.db.conversations.get({ sessionID: conversationID, accountSessionID: account.sessionID })
    : undefined,
  [conversationID, account])

  const handleSent = () => {
    conversationRef.current?.scrollToBottom()
  }

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
      {conversationID !== undefined && <Conversation conversationID={conversationID} ref={conversationRef} />}
      {conversationID !== undefined && <ConversationMessageInput conversationID={conversationID} onSent={handleSent} />}
    </div>
  )
}
