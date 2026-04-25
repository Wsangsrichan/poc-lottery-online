import { formatPrizeAmount } from '@/lib/lottery'
import type { PrizeMatch } from '@/lib/types'

interface PrizeBadgeProps {
  match: PrizeMatch
}

export default function PrizeBadge({ match }: PrizeBadgeProps) {
  return (
    <span
      className="inline-flex flex-col items-center gap-0.5 bg-gold text-white text-sm font-semibold rounded-full px-3 py-2 leading-tight"
      aria-label={`${match.name} ${formatPrizeAmount(match.amount)}`}
    >
      <span>{match.name}</span>
      <span className="text-xs font-normal opacity-90">{formatPrizeAmount(match.amount)}</span>
    </span>
  )
}
