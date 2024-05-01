import { Separator } from '@/shared/ui/separator'
import { SessionWebInfo } from '@/widgets/session-web-info'
import { useTranslation } from 'react-i18next'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col flex-1 h-full'>
      <div className="flex items-center px-4 py-2 h-14 shrink-0">
        <h1 className="text-xl font-bold">
          {t('inboxTitle')}
        </h1>
      </div>
      <Separator />
      <div className='flex-1 flex justify-center items-center h-full'>
        <SessionWebInfo />
      </div>
    </div>
  )
}
