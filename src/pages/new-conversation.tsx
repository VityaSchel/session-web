import { Separator } from '@/shared/ui/separator'
import { NewConversation } from '@/widgets/new-conversation'
import { useTranslation } from 'react-i18next'

export function NewConversationPage() {
  const { t } = useTranslation()

  return (
    <div className='flex flex-col flex-1 h-full'>
      <div className="flex items-center px-4 py-2 h-14 shrink-0">
        <h1 className="text-xl font-bold">
          {t('newConversationDm')}
        </h1>
      </div>
      <Separator />
      <div className='flex-1 w-full flex justify-center items-center'>
        <NewConversation />
      </div>
    </div>
  )
}