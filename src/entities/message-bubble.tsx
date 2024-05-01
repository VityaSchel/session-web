import { DbMessage } from '@/shared/api/storage'
import cx from 'classnames'
import { ImSpinner2 } from 'react-icons/im'
import { IoIosWarning } from 'react-icons/io'

export function MessageBubble({ msg }: {
  msg: DbMessage
}) {
  return (
    <div className={cx('flex gap-2 w-full', {
      'justify-start': msg.direction === 'incoming',
      'justify-end': msg.direction === 'outgoing',
    })}>
      <div className={cx('flex w-full max-w-[80%]', {
        'justify-start': msg.direction === 'incoming',
        'justify-end': msg.direction === 'outgoing',
      })}>
        {msg.direction === 'outgoing' && msg.sendingStatus === 'sending' && <span className='animate-spin origin-center w-2 h-2 self-end'><ImSpinner2 className='w-2 h-2' /></span>}
        {msg.direction === 'outgoing' && msg.sendingStatus === 'error' && <span className='w-4 h-4 self-end text-orange-600'><IoIosWarning className='w-4 h-4' /></span>}
        <div className={cx('px-3 py-[6px] rounded-2xl break-words w-fit max-w-[min(430px,100%)]', {
          'bg-conversation-bubble': msg.direction === 'incoming',
          'bg-brand text-black': msg.direction === 'outgoing',
        })}>
          <div className='text-[13px] font-normal leading-4 whitespace-pre-wrap'>{msg.textContent} <Timestamp 
            timestamp={msg.timestamp} 
            className={msg.direction === 'incoming' ? 'text-muted-foreground' : 'text-green-700'}
          /></div>
        </div>
      </div>
    </div>
  )
}

function Timestamp({ timestamp, className }: {
  timestamp: number
  className: string
}) {
  return (
    <span className={cx('text-[11px] pointer-events-none select-none ml-2 float-right mt-[2px]', className)}>
      {Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(timestamp)}
    </span>
  )
}