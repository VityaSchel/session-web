import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { HomePage } from '@/pages/index.tsx'
import { LoginPage } from '@/pages/login.tsx'
import { ConversationPage } from '@/pages/conversation.tsx'
import '@/shared/styles/global.css'
import {
  BrowserRouter,
  createBrowserRouter,
  Navigate,
  Route,
  RouterProvider,
  Routes,
} from 'react-router-dom'
import i18next from 'i18next'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'
import { Provider } from 'react-redux'
import { persistor, store } from '@/shared/store'
import { Toaster } from 'sonner'
import { ProtectedRoute } from '@/widgets/protected-route'
import { ThemeProvider } from '@/app/theme-provider'
import { PersistGate } from 'redux-persist/integration/react'
import { AppLoader } from '@/widgets/loader'
import { selectAccount } from '@/shared/store/slices/account'
import { useAppSelector } from '@/shared/store/hooks'
import { setIdentityKeypair } from '@/shared/api/storage'
import { generateKeypair } from '@/shared/api/account-manager'
import { ErrorBoundary } from '@/app/error-boundary'
import { poll } from '@/shared/poll'
import { SodiumLoader } from '@/app/sodium-loader'
import { MainWrapper } from '@/widgets/main-wrapper'

i18next
  .use(initReactI18next)
  .use(Backend)
  .init({
    lng: navigator.language || 'en',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    defaultNS: 'common'
  })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<AppLoader />}>
      <ThemeProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ErrorBoundary>
              <SodiumLoader>
                <App />
              </SodiumLoader>
            </ErrorBoundary>
          </PersistGate>
        </Provider>
      </ThemeProvider>
    </Suspense>
  </React.StrictMode>,
)

function App() {
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
    if(account) {
      poll()
      const pollInterval = setInterval(() => {
        poll()
      }, 1000 * 10)
      return () => {
        clearInterval(pollInterval)
      }
    }
  }, [account])

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<ProtectedRoute><MainWrapper /></ProtectedRoute>}>
            <Route path='/' element={<HomePage />} />
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