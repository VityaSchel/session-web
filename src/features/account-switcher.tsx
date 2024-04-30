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
import { selectAccount, setAccount } from '@/shared/store/slices/account'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import cx from 'classnames'

export function AccountSwitcher({ isCollapsed }: {
  isCollapsed: boolean
}) {
  const accounts = useLiveQuery(() => db.accounts.toArray())
  const selectedAccount = useAppSelector(selectAccount)
  const dispatch = useAppDispatch()

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

  const handleChangeAccount = async (newSessionID: string) => {
    const dbAccount = await db.accounts.get(newSessionID)
    if (!dbAccount) return
    dispatch(setAccount(dbAccount))
  }

  return (
    <Select value={selectedAccount.sessionID} onValueChange={handleChangeAccount}>
      <SelectTrigger
        className={cx(
          'flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
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
          <span className={cx('ml-2', isCollapsed && 'hidden')}>
            {selectedAccount.displayName || selectedAccount.sessionID}
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectableAccountItem account={account} key={account.sessionID} />
        ))}
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
        {account.displayName || account.sessionID}
      </div>
    </SelectItem>
  )
}