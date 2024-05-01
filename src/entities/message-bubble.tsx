import { DbMessage } from '@/shared/api/storage'
import cx from 'classnames'

export function MessageBubble({ msg }: {
  msg: DbMessage
}) {
  return (
    <div className={cx('flex gap-2 w-full', {
      'justify-start': msg.direction === 'incoming',
      'justify-end': msg.direction === 'outgoing',
    })}>
      <div className={cx('px-3 py-[6px] rounded-2xl max-w-[30%] break-words w-fit', {
        'bg-conversation-bubble': msg.direction === 'incoming',
        'bg-brand text-black': msg.direction === 'outgoing',
      })}>
        <div className='text-[13px] font-normal leading-4 whitespace-pre-wrap'>{msg.textContent} <Timestamp 
          timestamp={msg.timestamp} 
          className={msg.direction === 'incoming' ? 'text-muted-foreground' : 'text-green-700'}
        /></div>
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