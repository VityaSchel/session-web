import React from 'react'
import { TextField } from '@/shared/ui/text-field'
import { useTranslation } from 'react-i18next'
import { Button } from '@/shared/ui/button'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { decryptONSValue, generateOnsHash } from '@/shared/api/ons'
import { db } from '@/shared/api/storage'
import { useAppSelector } from '@/shared/store/hooks'
import { selectAccount } from '@/shared/store/slices/account'
import { ConversationType } from '@/shared/api/conversations'
import { useNavigate } from 'react-router-dom'
import { v4 as uuid } from 'uuid'

export function NewConversation() {
  const account = useAppSelector(selectAccount)
  const [recipient, setRecipient] = React.useState('')
  const { t } = useTranslation()
  const [disabled, setDisabled] = React.useState(false)
  const navigate = useNavigate()

  const handleCreateConversation = async () => {
    if (!account || disabled || !recipient) return
    
    let sessionID: string | null = null
    if(recipient.startsWith('05') && recipient.length === 66 && /^[0-9a-f]+$/.test(recipient)) {
      sessionID = recipient
    } else {
      if (recipient.length > 64 || !/^\w([\w-]*[\w])?$/.test(recipient)) {
        toast.error(t('onsInvalid'))
      } else {
        setDisabled(true)
        try {
          const hash = await generateOnsHash(recipient)
          const onsRequest = await fetch(import.meta.env.VITE_BACKEND_URL + '/ons?' + new URLSearchParams({
            hash
          }))
            .then(res => res.json() as Promise<{ ok: true, value: string | null } | { ok: false, error: string }>)
          if (!onsRequest.ok) {
            toast.error(onsRequest.error)
            return
          } else if (onsRequest.value === null) {
            toast.error(t('onsInvalid'))
            return
          } else {
            sessionID = await decryptONSValue(onsRequest.value, recipient)
          }
        } catch(e) {
          toast.error(e instanceof Error && e.message)
        } finally {
          setDisabled(false)
        }
      }      
    }

    if (sessionID) {
      if (!await db.conversations.get({ accountSessionID: account.sessionID, id: recipient })) {
        await db.conversations.add({
          id: uuid(),
          accountSessionID: account.sessionID,
          sessionID,
          lastMessage: null,
          lastMessageTime: 0,
          type: ConversationType.DirectMessages
        })
      }
      navigate('/conversation/' + sessionID)
    }
  }

  return (
    <div className='flex flex-col items-center gap-3'>
      <h1 className='text-xl font-medium'>{t('recipient')}:</h1>
      <div className='flex items-center gap-2'>
        <TextField 
          value={recipient}
          onChange={(e) => setRecipient(e.target.value.toLowerCase())}
          placeholder={t('inputRecipient')}
          className='w-72 outline-none focus:border-neutral-500 transition-colors duration-75'
          maxLength={66}
          disabled={disabled}
          onKeyPress={(e) => e.key === 'Enter' && handleCreateConversation()}
        />
        <Button
          size='icon'
          variant='secondary'
          disabled={recipient.length === 0 || disabled}
          onClick={handleCreateConversation}
        >
          <ArrowRight className='w-5 h-5' />
        </Button>
      </div>
      <a 
        href="https://ons.sessionbots.directory" 
        target='_blank' 
        rel='nofollower noreferrer' 
        className='text-neutral-600 hover:bg-neutral-800 hover:text-neutral-500 transition-all duration-100 underline-offset-2 mt-5 bg-neutral-900 rounded-full px-3 py-0.5 text-sm shadow-md hover:shadow-lg'
      >{t('aboutOns')}</a>
    </div>
  )
}