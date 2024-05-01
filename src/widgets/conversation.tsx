import React from 'react'
import * as Storage from '@/shared/api/storage'
import { useLiveQuery } from 'dexie-react-hooks'
import { selectAccount } from '@/shared/store/slices/account'
import { useAppSelector } from '@/shared/store/hooks'
import { isSameCalendarDate } from '@/shared/utils'
import { MessageBubble } from '@/entities/message-bubble'
import { ConversationDateSeparator } from '@/entities/conversation-date-separator'

export function Conversation({ conversationID }: {
  conversationID: string
}) {
  const account = useAppSelector(selectAccount)

  const messages = useLiveQuery(() => account
    ? Storage.db.messages
      .where({ accountSessionID: account.sessionID, conversationID })
      .sortBy('timestamp')
    : [],
    [account, conversationID]
  )

  const messagesWithSeparators = React.useMemo(() => {
    if (!messages) return undefined

    const messagesWithSeparators: (Storage.DbMessage | { timestamp: number })[] = []
    let lastTimestamp: number | undefined
    for (const msg of messages) {
      if (lastTimestamp === undefined || !isSameCalendarDate(lastTimestamp, msg.timestamp)) {
        messagesWithSeparators.push({ timestamp: msg.timestamp })
      }
      lastTimestamp = msg.timestamp
      messagesWithSeparators.push(msg)
    }
    return messagesWithSeparators
  }, [messages])

  return (
    <div className='flex flex-col p-4 gap-1 w-full min-h-full justify-end'>
      {messagesWithSeparators?.map(msgOrSeparator => (
        'hash' in msgOrSeparator
          ? <MessageBubble key={msgOrSeparator.hash} msg={msgOrSeparator} />
          : <ConversationDateSeparator key={msgOrSeparator.timestamp} timestamp={msgOrSeparator.timestamp} />
      ))}
    </div>
  )
}