import '@/shared/styles/global.css'
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { persistor, store } from '@/shared/store'
import { ThemeProvider } from '@/app/theme-provider'
import { PersistGate } from 'redux-persist/integration/react'
import { AppLoader } from '@/widgets/loader'
import { ErrorBoundary } from '@/app/error-boundary'
import { SodiumLoader } from '@/app/sodium-loader'
import { IndexedDbLoader } from '@/app/indexeddb-loader'
import { I18nLoader } from '@/app/i18n-loader'

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
                  <I18nLoader>
                    <AppComponent />
                  </I18nLoader>
                </IndexedDbLoader>
              </SodiumLoader>
            </ErrorBoundary>
          </PersistGate>
        </Provider>
      </ThemeProvider>
    </Suspense>
  </React.StrictMode>,
)