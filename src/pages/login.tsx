import React from 'react'
import { Button as SessionButton } from '@/shared/ui/session-button'
import { useTranslation } from 'react-i18next'
import { MdArrowRightAlt } from 'react-icons/md'
import { generateKeypair, generateMnemonic } from '@/shared/api/account-manager'
import { toHex } from '@/shared/api/utils/String'
import { toast } from 'sonner'
import { useAppDispatch, useAppSelector } from '@/shared/store/hooks'
import { selectAuthState, setAccount, setAuthorized } from '@/shared/store/slices/account'
import * as Storage from '@/shared/api/storage'
import { MnemonicInput } from '@/shared/ui/mnemonic-input'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/shared/ui/button'
import { ArrowLeftIcon } from 'lucide-react'
import cx from 'classnames'

export function LoginPage() {
  const [screen, setScreen] = React.useState<'main' | 'signin' | 'signup'>('main')

  return (
    <main className='flex justify-center items-center min-h-screen'>
      {{
        main: <MainScreen onSignIn={() => setScreen('signin')} onSignUp={() => setScreen('signup')} />,
        signin: <SignInScreen onGoBack={() => setScreen('main')} />,
        signup: <SignUpScreen onGoBack={() => setScreen('main')} />,
      }[screen]}
    </main>
  )
}

function MainScreen({ onSignIn, onSignUp }: {
  onSignIn: () => void
  onSignUp: () => void
}) {
  const authorized = useAppSelector(selectAuthState)
  const { t } = useTranslation()
  const navigate = useNavigate()
  
  return (
    <div className='flex flex-col items-center gap-2'>
      <div className='flex gap-2 items-center mb-4 w-full'>
        {authorized && (
          <Button onClick={() => navigate('/')} size='icon' variant='ghost' className='shrink-0'>
            <ArrowLeftIcon size={20} />
          </Button>
        )}
        <h1 className={cx('font-bold text-2xl w-full', {
          'text-center': !authorized
        })}>{t('authorization')}</h1>
      </div>
      <SessionButton className='w-full' onClick={onSignIn}>{t('signInHeader')}</SessionButton>
      <SessionButton className='w-full' onClick={onSignUp}>{t('createAccountHeader')}</SessionButton>
    </div>
  )
}

function SignInScreen({ onGoBack }: {
  onGoBack: () => void
}) {
  const [mnemonic, setMnemonic] = React.useState('')
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const handleLogin = async () => {
    try {
      const keypair = await generateKeypair(mnemonic)
      const sessionID = '05' + toHex(keypair.ed25519KeyPair.publicKey)
      if (sessionID.length !== 66) {
        throw new Error('Invalid public key: ' + sessionID)
      } else {
        if(await Storage.db.accounts.get(sessionID)) {
          toast.error(t('accountAlreadyExists'))
          return
        }

        await Storage.setIdentityKeypair(keypair)

        const dbAccount: Storage.DbAccount = {
          sessionID,
        }
        await Storage.db.accounts.put(dbAccount)

        dispatch(setAccount(dbAccount))
        dispatch(setAuthorized(true))
        navigate('/', { replace: true })
      }
    } catch(e) {
      console.error(e)
      toast.error(t('invalidMnemonic'))
    }
  }
            

  return (
    <div className='flex flex-col items-center gap-4 w-[400px] max-w-full'>
      <h1 className='font-bold text-2xl mb-2'>{t('signInHeader')}</h1>
      <MnemonicInput 
        value={mnemonic}
        onChange={setMnemonic}
        className='w-full'
      />
      <div className='flex gap-2'>
        <SessionButton onClick={onGoBack}>{t('goBack')}</SessionButton>
        <SessionButton onClick={handleLogin}>{t('signIn')} <MdArrowRightAlt /></SessionButton>
      </div>
    </div>
  )
}

function SignUpScreen({ onGoBack }: {
  onGoBack: () => void
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  const { mnemonic, sessionID, keypair } = React.useMemo(() => {
    const mnemonic = generateMnemonic()
    const keypair = generateKeypair(mnemonic)
    const sessionID = '05' + toHex(keypair.ed25519KeyPair.publicKey)
    return { mnemonic, sessionID, keypair }
  }, [])

  const handleContinue = async () => {
    if(await Storage.db.accounts.get(sessionID)) {
      toast.error(t('accountAlreadyExists'))
      return
    }

    await Storage.setIdentityKeypair(keypair)
    dispatch(setAuthorized(true))

    const dbAccount: Storage.DbAccount = {
      sessionID
    }
    await Storage.db.accounts.put(dbAccount)

    dispatch(setAccount(dbAccount))
    navigate('/', { replace: true })
  }

  return (
    <div className='flex flex-col items-center gap-6'>
      <h1 className='font-bold text-2xl'>{t('signUpHeader')}</h1>
      <div className='flex flex-col gap-2 items-center'>
        <span>{t('generatedSessionID')}</span>
        <span className='font-mono p-4 bg-neutral-800 border border-neutral-600'>
          {sessionID}
        </span>
      </div>
      <div className='flex flex-col gap-2 items-center'>
        <span>{t('generatedMnemonic')}</span>
        <span className='font-mono p-4 bg-neutral-800 border border-neutral-600'>
          {mnemonic}
        </span>
      </div>
      <div className='flex gap-2'>
        <SessionButton onClick={onGoBack}>{t('goBack')}</SessionButton>
        <SessionButton onClick={handleContinue}>{t('continue')} <MdArrowRightAlt /></SessionButton>
      </div>
    </div>
  )
}