import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatSessionID(sessionID: string, type: 'short' | 'long') {
  if(sessionID.length !== 66 || !sessionID.startsWith('05')) return sessionID
  if(type === 'short') {
    return sessionID.slice(0, 4) + '...' + sessionID.slice(-4)
  } else if(type === 'long') {
    return sessionID.slice(0, 10) + '...' + sessionID.slice(-10)
  }
}

export function isSameCalendarDate(ts1: number, ts2: number) {
  const date1 = new Date(ts1)
  const date2 = new Date(ts2)

  return date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
}