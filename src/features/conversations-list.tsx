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

export function ConversationsList({ isCollapsed }: {
  isCollapsed: boolean
}) {
  const conversations = useLiveQuery(() => db.conversations.toArray())
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
    const words = convo.displayName.split(' ')
    if (words.length > 1) {
      return words[0][0] + words[1][0]
    } else {
      return convo.displayName.slice(0, 2)
    }
  }, [convo.displayName])

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
            <Avatar>
              {displayImage && <AvatarImage src={displayImage} alt={convo.displayName} />}
              <AvatarFallback>{trimmedDisplayName.toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="sr-only">{convo.displayName}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-4">
          {convo.displayName}
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
        <Avatar>
          {displayImage && <AvatarImage src={displayImage} alt={convo.displayName} />}
          <AvatarFallback>{trimmedDisplayName.toUpperCase()}</AvatarFallback>
        </Avatar>
        {convo.displayName}
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