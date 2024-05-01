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

  const dates = React.useMemo(() => {
    if (!messages) return undefined

    const dates: { timestamp: number, messages: Storage.DbMessage[] }[] = []
    let lastTimestamp: number | undefined
    let messagesToday = []
    for (const msg of messages) {
      if (lastTimestamp !== undefined) {
        if (isSameCalendarDate(lastTimestamp, msg.timestamp)) {
          messagesToday.push(msg)
        } else {
          dates.push({ timestamp: lastTimestamp, messages: messagesToday })
          messagesToday = []
        }
      } else {
        messagesToday.push(msg)
      }
      lastTimestamp = msg.timestamp
    }
    if (messagesToday.length && lastTimestamp !== undefined) {
      dates.push({ timestamp: lastTimestamp, messages: messagesToday })
    }
    return dates
  }, [messages])

  return (
    <div className='flex flex-col p-4 gap-1 w-full min-h-full justify-end'>
      {dates?.map(date => (
        <div className='relative flex flex-col gap-1 w-full' key={date.timestamp}>
          <ConversationDateSeparator timestamp={date.timestamp} />
          {date.messages.map(msg => <MessageBubble key={msg.hash} msg={msg} />)}
        </div>
      ))}
    </div>
  )
}