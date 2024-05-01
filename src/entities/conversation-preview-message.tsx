import { DbConversation } from '@/shared/api/storage'
import { useTranslation } from 'react-i18next'

export function ConversationPreviewMessage({ message }: {
  message: DbConversation['lastMessage']
}) {
  const { t } = useTranslation()
  
  return (
    <div>
      <span className='text-muted-foreground'>
        {message.direction === 'outgoing' && t('messageOutgoingPrefix')}
      </span>{message.textContent}
    </div>
  )
}