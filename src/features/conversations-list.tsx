import React from 'react'
import { buttonVariants } from '@/shared/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/ui/tooltip'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { DbConversation, db } from '@/shared/api/storage'
import cx from 'classnames'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { ConversationType } from '@/shared/api/conversations'
import { useAppSelector } from '@/shared/store/hooks'
import { selectAccount } from '@/shared/store/slices/account'

export function ConversationsList({ isCollapsed }: {
  isCollapsed: boolean
}) {
  const account = useAppSelector(selectAccount)
  const conversations = useLiveQuery(() => account ? db.conversations.where({ accountSessionID: account.sessionID }).toArray() : [], [account])
  const params = useParams<{ id: string }>()
  const pathname = useLocation().pathname

  const selectedConvo: DbConversation | null = React.useMemo(() => {
    if (!conversations) return null
    if (pathname.startsWith('/conversation')) {
      return conversations?.find(convo => convo.id === params.id) || null
    }
    return null
  }, [params.id, conversations, pathname])

  return (
    <div
      data-collapsed={isCollapsed}
      className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2"
    >
      <nav className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2">
        {conversations?.map(convo => 
          <ConversationItem 
            key={convo.id}
            selected={selectedConvo ? convo.id === selectedConvo.id : false}
            convo={convo} 
            isCollapsed={isCollapsed} 
          />
        )}
      </nav>
    </div>
  )
}

function ConversationItem({ selected, convo, isCollapsed }: {
  selected: boolean
  convo: DbConversation
  isCollapsed: boolean
}) {
  const [newMessages, setNewMessages] = React.useState(0)

  const variant = selected ? 'default' : 'ghost'

  const displayImage = React.useMemo(() => {
    if(convo.displayImage) {
      return URL.createObjectURL(convo.displayImage)
    }
  }, [convo.displayImage])

  const trimmedDisplayName = React.useMemo(() => {
    if(convo.displayName) {
      const words = convo.displayName.split(' ')
      if (words.length > 1) {
        return words[0][0] + words[1][0]
      } else {
        return convo.displayName.slice(0, 2)
      }
    } else {
      if(convo.type === ConversationType.DirectMessages) {
        return convo.id.slice(2, 4)
      } else {
        return convo.id.slice(0, 2)
      }
    }
  }, [convo])

  React.useState(() => {
    async function getUnreadMessages() {
      const count = await db.messages.where({ conversationId: convo.id, read: false }).count()
      setNewMessages(count)
    }

    getUnreadMessages()
  })

  return (
    isCollapsed ? (
      <Tooltip key={convo.id} delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            to={`/conversation/${convo.id}`}
            className={cx(
              buttonVariants({ variant: variant, size: 'icon' }),
              'h-9 w-9',
              variant === 'default' &&
              'dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white'
            )}
          >
            <Avatar className='w-[24px] h-[24px] text-neutral-400 font-semibold text-xs'>
              {displayImage && <AvatarImage src={displayImage} alt={convo.displayName} />}
              <AvatarFallback>{trimmedDisplayName.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="sr-only">{convo.displayName || convo.id}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-4">
          {convo.displayName || convo.id}
          {newMessages > 0 && (
            <span className="ml-auto text-muted-foreground">
              {newMessages}
            </span>
          )}
        </TooltipContent>
      </Tooltip>
    ) : (
      <Link
        to={`/conversation/${convo.id}`}
        className={cx(
          buttonVariants({ variant: variant, size: 'sm' }),
          variant === 'default' &&
          'dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white',
          'justify-start'
        )}
      >
        <Avatar className='w-[24px] h-[24px] text-neutral-400 font-semibold text-xs'>
          {displayImage && <AvatarImage src={displayImage} alt={convo.displayName || convo.id} />}
          <AvatarFallback>{trimmedDisplayName.toUpperCase()}</AvatarFallback>
        </Avatar>
        {convo.displayName || convo.id}
        {newMessages > 0 && (
          <span
            className={cx(
              'ml-auto',
              variant === 'default' &&
              'text-background dark:text-white'
            )}
          >
            {newMessages}
          </span>
        )}
      </Link>
    )
  )
}