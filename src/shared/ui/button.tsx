import cx from 'classnames'

export function Button({ children, className, ...props }: React.PropsWithChildren<React.ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={cx('border border-green-500 font-bold text-green-500 px-4 py-2 rounded-full flex gap-2 items-center justify-center', className)}
      {...props}
    >
      {children}
    </button>
  )
}