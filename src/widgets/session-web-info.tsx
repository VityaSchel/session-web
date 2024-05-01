import SessionLogo from '@/assets/session-logo.svg?react'

export function SessionWebInfo() {
  return (
    <div className='flex flex-col justify-center items-center h-full gap-2'>
      <SessionLogo className='w-24 h-24' />
      <h1 className='text-4xl text-muted font-semibold select-none pointer-events-none'>Session Web</h1>
      <a href='https://hloth.dev' className='text-muted-foreground hover:underline underline-offset-2' target='_blank' rel='nofollow noreferrer'>Created by hloth.dev</a>
      <a href='https://github.com/VityaSchel/session-web' className='text-muted-foreground hover:underline underline-offset-2' target='_blank' rel='nofollow noreferrer'>Published on GitHub</a>
      <span className='text-muted'>v{import.meta.env.VITE_GIT_COMMIT_HASH.slice(0, 7)}</span>
    </div>
  )
}