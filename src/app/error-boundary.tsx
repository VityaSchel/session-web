import React from 'react'

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
    if (this.state.hasError) {
      return (
        <div className='bg-blue-600 flex items-center justify-center'>
          <div className='flex flex-col w-[75%] text-4xl [font-family:_Segoe_UI,Segoe,Roboto,sans-serif] gap-10'>
            <span className='text-8xl'>:(</span>
            <span>Session web ran into a problem that it couldn&apos;t handle, and now the page needs to be reloaded.</span>
            <span className='text-base'>{this.state.error}</span>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}