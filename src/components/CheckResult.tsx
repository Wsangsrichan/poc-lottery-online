'use client'

import type { PrizeMatch } from '@/lib/types'
import PrizeBadge from './PrizeBadge'
import ShareButton from './ShareButton'

interface CheckResultProps {
  ticket: string
  matches: PrizeMatch[]
}

export default function CheckResult({ ticket, matches }: CheckResultProps) {
  const won = matches.length > 0

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="ผลการตรวจ"
      className={[
        'w-full rounded-lg p-md shadow-sm',
        won
          ? 'bg-surface border-l-4 border-win'
          : 'bg-surface border border-border',
      ].join(' ')}
    >
      {won ? (
        <div className="flex flex-col gap-sm">
          <p className="text-2xl font-semibold text-gold leading-tight">ถูกรางวัล!</p>
          <div className="flex flex-wrap gap-2">
            {matches.map((match) => (
              <PrizeBadge key={match.id} match={match} />
            ))}
          </div>
          <ShareButton ticket={ticket} won={true} />
        </div>
      ) : (
        <div className="flex flex-col gap-xs">
          <p className="text-2xl font-semibold text-text-muted leading-tight">ไม่ถูกรางวัล</p>
          <p className="text-base text-text-muted">
            หมายเลข {ticket} ไม่ตรงกับรางวัลใดๆ ในงวดนี้
          </p>
        </div>
      )}
    </div>
  )
}
