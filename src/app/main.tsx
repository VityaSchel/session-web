import '@/shared/styles/global.css'
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import i18next from 'i18next'
import Backend from 'i18next-http-backend'
import { initReactI18next } from 'react-i18next'
import { Provider } from 'react-redux'
import { persistor, store } from '@/shared/store'
import { ThemeProvider } from '@/app/theme-provider'
import { PersistGate } from 'redux-persist/integration/react'
import { AppLoader } from '@/widgets/loader'
import { ErrorBoundary } from '@/app/error-boundary'
import { SodiumLoader } from '@/app/sodium-loader'
import { IndexedDbLoader } from '@/app/indexeddb-loader'

i18next
  .use(initReactI18next)
  .use(Backend)
  .init({
    lng: navigator.language || 'en',
    fallbackLng: 'en',
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    defaultNS: 'common'
  })

const AppComponent = React.lazy(() => import('@/app/app.tsx'))

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Suspense fallback={<AppLoader />}>
      <ThemeProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ErrorBoundary>
              <SodiumLoader>
                <IndexedDbLoader>
                  <AppComponent />
                </IndexedDbLoader>
              </SodiumLoader>
            </ErrorBoundary>
          </PersistGate>
        </Provider>
      </ThemeProvider>
    </Suspense>
  </React.StrictMode>,
)