import { LeftPanel } from '@/widgets/left-panel'
import { ResizablePanel } from '@/shared/ui/resizable'
import { PageWrapper } from '@/widgets/page-wrapper'
import { Outlet } from 'react-router-dom'

export function MainWrapper() {
  return (
    <PageWrapper>
      <LeftPanel />
      <ResizablePanel>
        <Outlet />
      </ResizablePanel>
    </PageWrapper>
  )
}