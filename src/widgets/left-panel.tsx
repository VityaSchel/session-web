import * as React from 'react'
import cx from 'classnames'
import {
  ResizableHandle,
  ResizablePanel,
} from '@/shared/ui/resizable'
import { Separator } from '@/shared/ui/separator'
import { AccountSwitcher } from '@/features/account-switcher'
import { ConversationsList } from '@/features/conversations-list'

export function LeftPanel() {
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  return (
    <>
      <ResizablePanel
        defaultSize={25}
        // collapsedSize={navCollapsedSize}
        collapsible={true}
        minSize={15}
        maxSize={30}
        onCollapse={(collapsed = false) => {
          setIsCollapsed(collapsed)
        }}
        className={cx(
          isCollapsed &&
          'min-w-[50px] transition-all duration-300 ease-in-out'
        )}
      >
        <div
          className={cx(
            'flex h-14 items-center justify-center',
            isCollapsed ? 'h-[52px]' : 'px-2'
          )}
        >
          <AccountSwitcher isCollapsed={isCollapsed} />
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