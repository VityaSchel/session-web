import { LeftPanel } from '@/widgets/left-panel'
import { Separator } from '@/shared/ui/separator'
import { PageWrapper } from '@/widgets/page-wrapper'
import { ResizablePanel } from '@/shared/ui/resizable'
import { useTranslation } from 'react-i18next'

export function HomePage() {
  const { t } = useTranslation()

  return (
    <PageWrapper>
      <LeftPanel />
      <ResizablePanel>
        <div className="flex items-center px-4 py-2 h-14">
            <h1 className="text-xl font-bold">
              {t('inboxTitle')}
            </h1>
          </div>
          <Separator />
        <div className='flex-1' style={{ display: 'flex', flexDirection: 'column', gap: 2, zoom: 2 }}>
          
        </div>
      </ResizablePanel>
    </PageWrapper>
  )
}
