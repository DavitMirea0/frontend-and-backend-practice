import type { Meeting } from './types'

const STORAGE_KEY = 'worst-ux-calendar:meetings:v1'

/**
 * LocalStorageService — единственный источник правды для встреч.
 * Никакого backend, никаких сетевых запросов. Всё живёт в localStorage.
 */
export const LocalStorageService = {
  getAll(): Meeting[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return []
      return parsed as Meeting[]
    } catch {
      return []
    }
  },

  save(meeting: Meeting): Meeting[] {
    const all = this.getAll()
    const next = [...all, meeting]
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  },

  remove(id: string): Meeting[] {
    const next = this.getAll().filter((m) => m.id !== id)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    return next
  },
}
