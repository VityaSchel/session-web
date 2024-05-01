export function CounterBadge({ children }: React.PropsWithChildren) {
  return (
    <span className='absolute top-0 right-0 bg-brand z-10 w-3.5 h-3.5 rounded-full flex items-center justify-center text-xs text-black shadow-[0px_0px_0px_2px_var(--background)]'>
      {children}
    </span>
  )
}