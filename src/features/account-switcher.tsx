import * as React from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select'
import { useLiveQuery } from 'dexie-react-hooks'
import { DbAccount, db } from '@/shared/api/storage'
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks'
import { selectAccount, setAccount, setAuthorized } from '@/shared/store/slices/account'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import cx from 'classnames'
import { useTranslation } from 'react-i18next'
import { LogOutIcon, PlusIcon } from 'lucide-react'
import { formatSessionID } from '@/shared/utils'
import { useNavigate } from 'react-router-dom'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/ui/alert-dialog'

export function AccountSwitcher({ isCollapsed }: {
  isCollapsed: boolean
}) {
  const accounts = useLiveQuery(() => db.accounts.toArray())
  const selectedAccount = useAppSelector(selectAccount)
  const dispatch = useAppDispatch()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [logoutWarningDialog, setLogoutWarningDialog] = React.useState<false | string>(false)

  const avatar = React.useMemo(() => {
    if(!selectedAccount || !selectedAccount.profileImage) return
    return URL.createObjectURL(selectedAccount.profileImage)
  }, [selectedAccount])

  const trimmedDisplayName = React.useMemo(() => {
    if (!selectedAccount) return ''
    if (selectedAccount.displayName) {
      const words = selectedAccount.displayName.split(' ')
      if (words.length > 1) {
        return words[0][0] + words[1][0]
      } else {
        return selectedAccount.displayName.slice(0, 2)
      } 
    } else {
      return selectedAccount.sessionID.slice(2, 4)
    }
  }, [selectedAccount])

  if (selectedAccount === null || !accounts) return

  const handleChange = async (key: string) => {
    if(key === 'new') {
      navigate('/login')
    } else if(key === 'logout') {
      setLogoutWarningDialog(selectedAccount.sessionID)
    } else {
      const newSessionID = key
      const dbAccount = await db.accounts.get(newSessionID)
      if (!dbAccount) return
      dispatch(setAccount(dbAccount))
    }
  }

  const handleLogout = async () => {
    setLogoutWarningDialog(false)
    await db.accounts.delete(selectedAccount.sessionID)
    const conversationKeys = await db.conversations.where({ accountSessionID: selectedAccount.sessionID }).keys()
    await db.conversations.bulkDelete(conversationKeys)
    const messagesKeys = await db.messages.where({ accountSessionID: selectedAccount.sessionID }).keys()
    await db.conversations.bulkDelete(messagesKeys)
    const accountsLeft = accounts.filter(account => account.sessionID !== selectedAccount.sessionID)
    if (accountsLeft.length > 0) {
      dispatch(setAccount(accountsLeft[0]))
    } else {
      dispatch(setAuthorized(false))
      dispatch(setAccount(null))
      navigate('/login')
    }
  }

  return (
    <Select value={selectedAccount.sessionID} onValueChange={handleChange}>
      <SelectTrigger
        className={cx(
          'flex flex-1 items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 min-w-0',
          isCollapsed &&
          'flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden'
        )}
        aria-label="Select account"
      >
        <SelectValue placeholder="Select an account">
          <Avatar className='w-[24px] h-[24px] text-neutral-400 font-semibold text-xs'>
            {avatar && <AvatarImage src={avatar} alt={selectedAccount.displayName || selectedAccount.sessionID} />}
            <AvatarFallback>{trimmedDisplayName.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className={cx('ml-2 max-w-full overflow-hidden text-ellipsis', isCollapsed && 'hidden')}>
            {selectedAccount.displayName || selectedAccount.sessionID}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectableAccountItem account={account} key={account.sessionID} />
        ))}
        <SelectItem value='new'>
          <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
            <PlusIcon />
            {t('addNewAccount')}
          </div>
        </SelectItem>
        <SelectItem value='logout'>
          <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
            <LogOutIcon />
            {t('logout')}
          </div>
        </SelectItem>
        <LogoutWarningDialog 
          open={logoutWarningDialog !== false} 
          onClose={() => setLogoutWarningDialog(false)}
          onSubmit={handleLogout}
        />
      </SelectContent>
    </Select>
  )
}

function SelectableAccountItem({ account }: {
  account: DbAccount
}) {
  const avatar = React.useMemo(() => {
    if(!account.profileImage) return
    return URL.createObjectURL(account.profileImage)
  }, [account.profileImage])

  const trimmedDisplayName = React.useMemo(() => {
    if (account.displayName) {
      const words = account.displayName.split(' ')
      if (words.length > 1) {
        return words[0][0] + words[1][0]
      } else {
        return account.displayName.slice(0, 2)
      }
    } else {
      return account.sessionID.slice(2, 4)
    }
  }, [account])

  return (
    <SelectItem key={account.sessionID} value={account.sessionID}>
      <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
        <Avatar className='w-[24px] h-[24px] text-neutral-400 font-semibold text-xs'>
          {avatar && <AvatarImage src={avatar} alt={account.displayName} />}
          <AvatarFallback>{trimmedDisplayName.toUpperCase()}</AvatarFallback>
        </Avatar>
        {account.displayName || formatSessionID(account.sessionID, 'long')}
      </div>
    </SelectItem>
  )
}

function LogoutWarningDialog({ open, onClose, onSubmit }: {
  open: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const { t } = useTranslation()

  return (
    <AlertDialog open={open} onOpenChange={() => open && onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('logoutConfirmation')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('logoutConfirmationDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onSubmit} className='bg-red-600 hover:bg-red-500 text-white'>{t('confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}