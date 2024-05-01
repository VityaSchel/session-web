import { isSameCalendarDate } from '@/shared/utils'
import { useTranslation } from 'react-i18next'

export function ConversationDateSeparator({ timestamp }: {
  timestamp: number
}) {
  const { t, i18n } = useTranslation()

  return (
    <div className='flex justify-center sticky top-2'>
      <span className='bg-neutral-800 rounded-full px-2 py-0.5 font-medium text-sm'>
        {isSameCalendarDate(timestamp, Date.now()) 
          ? t('today')
          : Intl.DateTimeFormat(i18n.language, {
            day: 'numeric',
            month: 'long'
          }).format(timestamp)
        }
      </span>
    </div>
  )
}