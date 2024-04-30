import cx from 'classnames'

export function TextField({ className, ...props }: React.PropsWithChildren<React.InputHTMLAttributes<HTMLInputElement>>) {
  return (
    <input className={cx('py-2 px-3 rounded-md border border-neutral-600 bg-neutral-200 bg-opacity-10', className)} type="text" {...props} />
  )
}