import type { HistoryEntry } from '@/lib/types'
import PrizeBadge from './PrizeBadge'

interface HistoryItemProps {
  entry: HistoryEntry
  onRecheck: (ticket: string) => void
}

export default function HistoryItem({ entry, onRecheck }: HistoryItemProps) {
  const won = entry.matches.length > 0

  return (
    <button
      type="button"
      onClick={() => onRecheck(entry.ticket)}
      className="flex items-center justify-between w-full min-h-[44px] px-md py-2 border-b border-gray-50
        hover:bg-gold-light/20 transition-colors duration-100 text-left cursor-pointer"
      aria-label={`ตรวจหมายเลข ${entry.ticket} อีกครั้ง`}
    >
      <span className="text-base font-mono tracking-widest text-text">{entry.ticket}</span>
      {won ? (
        <div className="flex flex-wrap gap-1 justify-end">
          {entry.matches.map((m) => (
            <PrizeBadge key={m.id} match={m} />
          ))}
        </div>
      ) : (
        <span className="text-sm text-text-muted">ไม่ถูก</span>
      )}
    </button>
  )
}
