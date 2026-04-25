import type { HistoryEntry } from './types'

const HISTORY_KEY = 'lottery-history'
const MAX_ENTRIES = 50

export function getHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    return JSON.parse(raw) as HistoryEntry[]
  } catch {
    return []
  }
}

export function addHistoryEntry(entry: HistoryEntry): void {
  if (typeof window === 'undefined') return
  try {
    const existing = getHistory()
    const updated = [entry, ...existing].slice(0, MAX_ENTRIES)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
  } catch {
    // Ignore QuotaExceededError — history is non-critical
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(HISTORY_KEY)
}
