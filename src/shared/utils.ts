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