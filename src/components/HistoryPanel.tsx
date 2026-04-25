'use client'

import { useState, useEffect, useCallback } from 'react'
import type { HistoryEntry } from '@/lib/types'
import { getHistory } from '@/lib/history'
import HistoryItem from './HistoryItem'

interface HistoryPanelProps {
  onRecheck: (ticket: string) => void
}

function groupByDraw(entries: HistoryEntry[]): Map<string, HistoryEntry[]> {
  const groups = new Map<string, HistoryEntry[]>()
  for (const entry of entries) {
    const key = entry.drawDateThai
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(entry)
  }
  return groups
}

export default function HistoryPanel({ onRecheck }: HistoryPanelProps) {
  const [history, setHistory] = useState<HistoryEntry[] | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const entries = getHistory()
    setHistory(entries)
    setIsOpen(entries.length === 0)
  }, [])

  const refresh = useCallback(() => {
    setHistory(getHistory())
  }, [])

  const handleRecheck = useCallback((ticket: string) => {
    onRecheck(ticket)
    setTimeout(refresh, 50)
  }, [onRecheck, refresh])

  if (history === null) return null

  const grouped = groupByDraw(history)

  return (
    <section className="w-full px-md">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center justify-between w-full text-left py-sm min-h-[44px]"
        aria-expanded={isOpen}
      >
        <h2 className="text-xl font-semibold text-text">ประวัติการตรวจ</h2>
        <span className="text-text-muted text-sm">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="mt-sm">
          {history.length === 0 ? (
            <div className="text-center py-lg">
              <p className="text-base font-semibold text-text">ยังไม่มีประวัติการตรวจ</p>
              <p className="text-sm text-text-muted mt-xs">ตรวจสลากแล้ว ประวัติจะปรากฏที่นี่</p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              {Array.from(grouped.entries()).map(([drawDate, entries]) => (
                <div key={drawDate}>
                  <p className="text-sm text-text-muted px-md py-xs bg-surface-2 border-b border-border">
                    งวด {drawDate}
                  </p>
                  {entries.map((entry) => (
                    <HistoryItem
                      key={`${entry.ticket}-${entry.checkedAt}`}
                      entry={entry}
                      onRecheck={handleRecheck}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
