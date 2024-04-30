import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { HomePage } from '@/pages/index.tsx'
import { LoginPage } from '@/pages/login.tsx'
import { ConversationPage } from '@/pages/conversation.tsx'
import '@/shared/styles/global.css'
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
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

const router = createBrowserRouter([
  {
    path: '/',
    element: <ProtectedRoute><HomePage /></ProtectedRoute>,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/conversation/:id',
    element: <ProtectedRoute><ConversationPage /></ProtectedRoute>,
  },
  {
    path: '*',
    element: <Navigate to='/' />,
  },
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<AppLoader />}>
      <ThemeProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <div>
              <RouterProvider router={router} />
              <Toaster richColors />
            </div>
          </PersistGate>
        </Provider>
      </ThemeProvider>
    </Suspense>
  </React.StrictMode>,
)
