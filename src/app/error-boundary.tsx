import { Button } from '@/shared/ui/button'
import React from 'react'
import { t } from 'i18next'

export class ErrorBoundary extends React.Component<React.PropsWithChildren, { hasError: boolean, error: string }> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { hasError: false, error: '' }
  }

  static getDerivedStateFromError(error: unknown) {
    console.error(error)
    return { hasError: true, error: error instanceof Error ? error.message : '' }
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error(error, info)
  }

  render() {
    const handleEraseDb = () => {
      if(confirm(t('clearDbWarning'))) {
        window.localStorage.clear()
        window.indexedDB.deleteDatabase('session-web')
        window.location.reload()
        alert('😔 sorry for this')
      } 
    }

    if (this.state.hasError) {
      return (
        <div className='bg-blue-600 flex items-center justify-center'>
          <div className='flex flex-col w-[75%] text-4xl [font-family:_Segoe_UI,Segoe,Roboto,sans-serif] gap-10'>
            <span className='text-8xl'>:(</span>
            <span>{t('unhandledError')}</span>
            <span className='text-base'>{this.state.error}</span>
            <Button variant='link' className='w-fit px-0' onClick={handleEraseDb}>{t('clearDb')}</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}