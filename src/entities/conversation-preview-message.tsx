import { DbConversation } from '@/shared/api/storage'
import { useTranslation } from 'react-i18next'

export function ConversationPreviewMessage({ message }: {
  message: DbConversation['lastMessage']
}) {
  const { t } = useTranslation()

  if(!message) return null
  
  return (
    <div className='text-ellipsis overflow-hidden'>
      <span className='text-muted-foreground'>
        {message.direction === 'outgoing' && t('messageOutgoingPrefix')}
      </span>{message.textContent}
    </div>
  )
}