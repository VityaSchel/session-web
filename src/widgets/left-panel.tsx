import * as React from 'react'
import cx from 'classnames'
import {
  ResizableHandle,
  ResizablePanel,
} from '@/shared/ui/resizable'
import { Separator } from '@/shared/ui/separator'
import { AccountSwitcher } from '@/features/account-switcher'
import { ConversationsList } from '@/features/conversations-list'
import { CreateConversationButton } from '@/entities/create-conversation-button'

export function LeftPanel() {
  const [isCollapsed, setIsCollapsed] = React.useState(false)
  // const [collapsedSize, setCollapsedSize] = React.useState()
  // const panelRef = React.useRef<HTMLDivElement>(null)
  
  // React.useLayoutEffect(() => {
  //   const panelGroup = document.querySelector('[data-panel-group-id="group"]')
  //   const resizeHandles = document.querySelectorAll(
  //     '[data-panel-resize-handle-id]'
  //   )
  //   const observer = new ResizeObserver(() => {
  //     let width = panelGroup.offsetWidth

  //     resizeHandles.forEach((resizeHandle) => {
  //       width -= resizeHandle.offsetHeight
  //     })

  //     setCollapsedSize((MIN_SIZE_IN_PIXELS / width) * 100)
  //   })
  //   observer.observe(panelGroup as Element)
  //   resizeHandles.forEach((resizeHandle) => {
  //     observer.observe(resizeHandle)
  //   })

  //   return () => {
  //     observer.disconnect()
  //   }
  // }, [])

  return (
    <>
      <ResizablePanel
        defaultSize={25}
        collapsedSize={4}
        collapsible={true}
        minSize={15}
        maxSize={30}
        onCollapse={() => setIsCollapsed(true)}
        onExpand={() => setIsCollapsed(false)}
        className={cx('flex flex-col', {
          'min-w-[52px] max-w-[52px]': isCollapsed,
          'min-w-[200px]': !isCollapsed,
        })}
      >
        <div
          className={cx(
            'flex h-[56px] items-center justify-center shrink-0 gap-1 px-2',
            isCollapsed ? 'h-[52px]' : ''
          )}
        >
          <AccountSwitcher isCollapsed={isCollapsed} />
          {!isCollapsed && (
            <CreateConversationButton className='shrink-0' />
          )}
        </div>
        <Separator />
        <ConversationsList isCollapsed={isCollapsed} />
        {/** todo: pinned */}
        {/* <Separator />
        <ConversationsList isCollapsed={isCollapsed} /> */}
      </ResizablePanel>
      <ResizableHandle withHandle />
    </>
  )
}