import React from 'react'
import { useTranslation } from 'react-i18next'
import cx from 'classnames'

export function MnemonicInput({ className, value, onChange }: {
  className?: string
  value: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const words = React.useMemo(() => value.split(' ').filter(w => w !== ''), [value])

  return (
    <div className='flex flex-col items-end gap-3 mt-4 w-full'>
      <input
        className={cx('bg-black border-neutral-500 border px-4 py-4 font-mono w-full focus:outline-none focus:border-neutral-600', className)}
        value={value}
        placeholder={t('mnemonic')}
        maxLength={32 * 13}
        onChange={e => {
          const value = e.target.value
            .toLowerCase()
            .replaceAll(/[^a-z ]/g, '')
          const words = value.split(' ')
          onChange(
            words
              .filter((word, i, words) => {
                if (i === words.length - 1 || word !== '') return true
                else return false
              })
              .slice(0, 13)
              .join(' ')
          )
        }}
      />
      <span className='font-mono tabular-nums'>{words.length}/13</span>
    </div>
  )
}