import { ResizablePanelGroup } from '@/shared/ui/resizable'
import { TooltipProvider } from '@/shared/ui/tooltip'

export function PageWrapper({ children }: React.PropsWithChildren) {
  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full max-h-[800px] items-stretch"
      >
      {children}
      </ResizablePanelGroup>
    </TooltipProvider>
  )
}