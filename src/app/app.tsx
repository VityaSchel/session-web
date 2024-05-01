import React from 'react'
import { HomePage } from '@/pages/index.tsx'
import { LoginPage } from '@/pages/login.tsx'
import { ConversationPage } from '@/pages/conversation.tsx'
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom'

import { Toaster } from 'sonner'
import { ProtectedRoute } from '@/widgets/protected-route'
import { selectAccount } from '@/shared/store/slices/account'
import { useAppSelector } from '@/shared/store/hooks'
import { setIdentityKeypair } from '@/shared/api/storage'
import { generateKeypair } from '@/shared/api/account-manager'
import { poll } from '@/shared/poll'
import { MainWrapper } from '@/widgets/main-wrapper'
import { resetTargetNode, resetTargetSwarm } from '@/shared/nodes'
import { NewConversationPage } from '@/pages/new-conversation'
import { toast } from 'sonner'
import { t } from 'i18next'

export default function App() {
  const account = useAppSelector(selectAccount)

  React.useEffect(() => {
    if (account) {
      const keypair = generateKeypair(account.mnemonic)
      setIdentityKeypair(keypair)
    } else {
      setIdentityKeypair(undefined)
    }
  }, [account])

  React.useEffect(() => {
    if (account) {
      resetTargetNode()
      resetTargetSwarm()
      poll()
      const pollInterval = setInterval(() => {
        poll()
      }, 1000 * 10)
      return () => {
        clearInterval(pollInterval)
      }
    }
  }, [account])

  React.useEffect(() => {
    if (window.shimmedIndexedDb) {
      toast.warning(t('indexedDbNotAvailable'))
    }
  }, [])

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<ProtectedRoute><MainWrapper /></ProtectedRoute>}>
            <Route path='/' element={<HomePage />} />
            <Route path='/conversation/new' element={<NewConversationPage />} />
            <Route path='/conversation/:id' element={<ConversationPage />} />
          </Route>
          <Route path='/login' element={<LoginPage />} />
          <Route path='*' element={<Navigate to='/' />} />
        </Routes>
      </BrowserRouter>
      <Toaster richColors />
    </div>
  )
}