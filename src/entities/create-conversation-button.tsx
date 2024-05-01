import React from 'react'
import { Button } from '@/shared/ui/button'
import { SquarePenIcon } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '@/shared/ui/context-menu'
import { useTranslation } from 'react-i18next'
import { LuMessageSquare } from 'react-icons/lu'
import { RiGroupLine } from 'react-icons/ri'
import { CiGlobe } from 'react-icons/ci'
import { useNavigate } from 'react-router-dom'

export function CreateConversationButton({ className }: {
  className?: string
}) {
  const { t } = useTranslation()
  const trigger = React.useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()

  const handleOpen = () => {
    trigger.current?.dispatchEvent(
      new MouseEvent('contextmenu', {
        bubbles: true,
        clientX: trigger.current.getBoundingClientRect().x,
        clientY: trigger.current.getBoundingClientRect().y + 20,
      }),
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger ref={trigger} />
      <Button size='icon' variant='secondary' className={className} onClick={handleOpen}>
        <SquarePenIcon size={16} />
      </Button>
      <ContextMenuContent className="w-[220px]">
        <ContextMenuItem onClick={() => navigate('/conversation/new')}>
          <LuMessageSquare className="mr-2" />
          {t('newConversationDm')}
        </ContextMenuItem>
        <ContextMenuItem disabled>
          <RiGroupLine className="mr-2" />
          {t('newConversationGroup')}
        </ContextMenuItem>
        <ContextMenuItem disabled>
          <CiGlobe className="mr-2" />
          {t('joinCommunity')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}