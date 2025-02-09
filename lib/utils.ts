import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function debounce<T extends (...args: any[]) => Promise<any>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timeout: NodeJS.Timeout | null = null
  let pendingPromise: Promise<ReturnType<T>> | null = null

  return function executedFunction(...args: Parameters<T>): Promise<ReturnType<T>> {
    if (pendingPromise) return pendingPromise

    return new Promise((resolve, reject) => {
      const later = () => {
        timeout = null
        pendingPromise = func(...args)
          .then((result) => {
            pendingPromise = null
            resolve(result)
            return result
          })
          .catch((error) => {
            pendingPromise = null
            reject(error)
            throw error
          })
      }

      if (timeout) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(later, wait)
    })
  }
}
