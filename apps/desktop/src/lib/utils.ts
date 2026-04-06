import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toFileUrl(path: string) {
  const normalized = path.replace(/\\/g, '/')
  return encodeURI(`file://${normalized}`)
}
