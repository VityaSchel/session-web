import React from 'react'
import { Button } from '@/shared/ui/button'
import { useTranslation } from 'react-i18next'
import { MdArrowRightAlt } from 'react-icons/md'
import { TextField } from '@/shared/ui/text-field'
import { generateKeypair, generateMnemonic } from '@/shared/api/account-manager'
import { toHex } from '@/shared/api/utils/String'
import { toast } from 'sonner'
import { useAppDispatch } from '@/shared/store/hooks'
import { setAuthorized } from '@/shared/store/slices/account'
import * as Storage from '@/shared/api/storage'
import { MnemonicInput } from '@/shared/ui/mnemonic-input'
import { useNavigate } from 'react-router-dom'

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
  const { t } = useTranslation()
  
  return (
    <div className='flex flex-col items-center gap-2'>
      <h1 className='font-bold text-2xl mb-4'>{t('authorization')}</h1>
      <Button className='w-full' onClick={onSignIn}>{t('signInHeader')}</Button>
      <Button className='w-full' onClick={onSignUp}>{t('createAccountHeader')}</Button>
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
      if(keypair.ed25519KeyPair.publicKey.length !== 32) {
        throw new Error('Invalid public key: ' + keypair.ed25519KeyPair.publicKey)
      } else {
        await Storage.setIdentityKeypair(keypair)
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
        <Button onClick={onGoBack}>{t('goBack')}</Button>
        <Button onClick={handleLogin}>{t('signIn')} <MdArrowRightAlt /></Button>
      </div>
    </div>
  )
}

function SignUpScreen({ onGoBack }: {
  onGoBack: () => void
}) {
  const { t } = useTranslation()
  const { mnemonic, sessionID } = React.useMemo(() => {
    const mnemonic = generateMnemonic()
    const keypair = generateKeypair(mnemonic)
    const sessionID = toHex(keypair.ed25519KeyPair.publicKey)
    return { mnemonic, sessionID }
  }, [])

  return (
    <div className='flex flex-col items-center gap-6'>
      <h1 className='font-bold text-2xl'>{t('signUpHeader')}</h1>
      <div className='flex flex-col gap-2 items-center'>
        <span>{t('generatedSessionID')}</span>
        <span className='font-mono p-4 bg-neutral-800 border border-neutral-600'>
          05{sessionID}
        </span>
      </div>
      <div className='flex flex-col gap-2 items-center'>
        <span>{t('generatedMnemonic')}</span>
        <span className='font-mono p-4 bg-neutral-800 border border-neutral-600'>
          {mnemonic}
        </span>
      </div>
      <div className='flex gap-2'>
        <Button onClick={onGoBack}>{t('goBack')}</Button>
        <Button>{t('continue')} <MdArrowRightAlt /></Button>
      </div>
    </div>
  )
}