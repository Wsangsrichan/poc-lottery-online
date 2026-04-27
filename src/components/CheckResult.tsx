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
      className="animate-[fade-in-up_0.3s_ease-out]"
    >
      {won ? (
        <div className="flex flex-col gap-md p-lg bg-lottery-green animate-[fade-in-up_0.3s_ease-out]">
          <p className="text-3xl font-semibold text-white leading-tight">ถูกรางวัล!</p>
          <div className="flex flex-wrap gap-2">
            {matches.map((match) => (
              <PrizeBadge key={match.id} match={match} />
            ))}
          </div>
          <ShareButton ticket={ticket} won={true} />
        </div>
      ) : (
        <div className="flex flex-col gap-xs py-sm">
          <p className="text-base font-semibold text-text-muted leading-tight">ไม่ถูกรางวัล</p>
          <p className="text-sm text-text-muted">
            หมายเลข <span className="font-mono tracking-wider">{ticket}</span> ไม่ตรงกับรางวัลใดในงวดนี้
          </p>
        </div>
      )}
    </div>
  )
}
