import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { MdArrowUpward } from 'react-icons/md'
import TextareaAutosize from 'react-textarea-autosize'
import { sendMessage } from '@/shared/api/messages-sender'
import { VisibleMessage } from '@/shared/api/messages/visibleMessage/VisibleMessage'
import * as UserUtils from '@/shared/api/utils/User'
import { getNowWithNetworkOffset } from '@/shared/api/get-network-time'
import { v4 as uuid } from 'uuid'
import { db } from '@/shared/api/storage'
import { useAppSelector } from '@/shared/store/hooks'
import { selectAccount } from '@/shared/store/slices/account'

export function ConversationMessageInput({ conversationID, onSent }: {
  conversationID: string
  onSent: () => void
}) {
  const [message, setMessage] = React.useState('')
  const account = useAppSelector(selectAccount)
  const { t } = useTranslation()

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if(e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSendMessage = async () => {
    if (!account) return
    if(message !== '') {
      const timestamp = await getNowWithNetworkOffset()
      const messageInstance = new VisibleMessage({
        body: message,
        lokiProfile: await UserUtils.getOurProfile(),
        timestamp: timestamp,
        expirationType: 'unknown',
        expireTimer: 0,
        identifier: uuid(),
        attachments: [],
        preview: [],
        quote: undefined
      })
      const tempHash = 'temp-unsent-message_' + uuid()
      await db.messages.add({
        direction: 'outgoing',
        conversationID,
        hash: tempHash,
        accountSessionID: account.sessionID,
        textContent: message,
        read: Number(true) as 0 | 1,
        timestamp,
        sendingStatus: 'sending'
      })
      setMessage('')
      onSent()
      const result = await sendMessage(conversationID, messageInstance)
      await db.messages.update(tempHash, {
        ...(result.ok && { hash: result.hash }),
        sendingStatus: result.ok ? 'sent' : 'error'
      })
    }
  }

  return (
    <div className='flex items-end w-full bg-background border border-t-neutral-800 border-x-0 border-b-0 pr-2 gap-2'>
      <TextareaAutosize
        placeholder={t('typeMessagePlaceholder')}
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        minRows={1}
        maxRows={5}
        className='rounded-none outline-none flex-1 min-w-0 p-4 placeholder:text-neutral-500 text-sm bg-none resize-none transition-[height] [&::-webkit-scrollbar]:hidden h-[52px]'
      />
      <Button 
        size='icon'
        variant='secondary'
        className='mb-2'
        onClick={handleSendMessage}
      >
        <MdArrowUpward />
      </Button>
    </div>
  )
}