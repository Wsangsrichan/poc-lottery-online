import type { LotteryResult } from '@/lib/types'
import { formatPrizeAmount } from '@/lib/lottery'

interface PrizeTableProps {
  draw: LotteryResult
}

const PRIZE_ROWS = [
  { label: 'รางวัลที่ 1', key: 'first' as const, amount: 2_000_000, special: null as null, highlight: true },
  { label: 'รางวัลข้างเคียงรางวัลที่ 1', key: null as null, amount: 100_000, special: 'adjacent' as const, highlight: false },
  { label: 'รางวัลที่ 2', key: 'second' as const, amount: 200_000, special: null, highlight: false },
  { label: 'รางวัลที่ 3', key: 'third' as const, amount: 80_000, special: null, highlight: false },
  { label: 'รางวัลที่ 4', key: 'fourth' as const, amount: 40_000, special: null, highlight: false },
  { label: 'รางวัลที่ 5', key: 'fifth' as const, amount: 20_000, special: null, highlight: false },
  { label: 'เลขหน้า 3 ตัว', key: 'front3' as const, amount: 4_000, special: null, highlight: false },
  { label: 'เลขท้าย 3 ตัว', key: 'back3' as const, amount: 4_000, special: null, highlight: false },
  { label: 'เลขท้าย 2 ตัว', key: 'back2' as const, amount: 2_000, special: null, highlight: false },
]

function getAdjacentNumbers(first: string): string[] {
  const n = parseInt(first, 10)
  const below = n > 0 ? (n - 1).toString().padStart(6, '0') : null
  const above = n < 999999 ? (n + 1).toString().padStart(6, '0') : null
  return [below, above].filter((x): x is string => x !== null)
}

export default function PrizeTable({ draw }: PrizeTableProps) {
  return (
    <section className="w-full">
      <h2 className="text-lg font-semibold text-text pb-sm">ผลรางวัลงวดนี้</h2>
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full border-collapse">
          <caption className="sr-only">ผลรางวัลสลากกินแบ่งรัฐบาล</caption>
          <thead>
            <tr className="bg-surface-2">
              <th scope="col" className="text-left text-xs font-semibold text-text-muted px-md py-2.5">รางวัล</th>
              <th scope="col" className="text-left text-xs font-semibold text-text-muted px-sm py-2.5">หมายเลข</th>
              <th scope="col" className="text-right text-xs font-semibold text-text-muted px-md py-2.5">รางวัล (บาท)</th>
            </tr>
          </thead>
          <tbody>
            {PRIZE_ROWS.map((row, idx) => {
              let numbers: string[] = []
              if (row.special === 'adjacent') {
                numbers = getAdjacentNumbers(draw.first)
              } else if (row.key) {
                const val = draw[row.key]
                numbers = Array.isArray(val) ? val : [val as string]
              }

              return (
                <tr
                  key={row.label}
                  className={[
                    idx % 2 === 0 ? 'bg-white' : 'bg-surface-2/50',
                    row.highlight ? 'bg-lottery-green-light font-semibold' : '',
                  ].join(' ')}
                >
                  <td className={`text-sm text-gray-700 px-md py-2.5 align-top whitespace-nowrap ${row.highlight ? 'font-semibold text-lg text-lottery-green' : ''}`}>
                    {row.label}
                  </td>
                  <td className="text-sm px-sm py-2.5 align-top font-mono tracking-wider text-text">
                    {row.highlight ? <span className="font-semibold text-lg text-lottery-green">{numbers.join(', ')}</span> : numbers.join(', ')}
                  </td>
                  <td className={`text-sm text-right px-md py-2.5 align-top tabular-nums ${row.highlight ? 'font-semibold text-lg text-lottery-green' : 'text-text'}`}>
                    {formatPrizeAmount(row.amount)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
