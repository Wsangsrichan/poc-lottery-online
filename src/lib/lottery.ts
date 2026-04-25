import type { LotteryResult, PrizeMatch, PrizeTierId } from './types'
import { PRIZE_NAMES, PRIZE_AMOUNTS } from './types'

export function matchPrizes(ticket: string, draw: LotteryResult): PrizeMatch[] {
  const matches: PrizeMatch[] = []

  function push(id: PrizeTierId, matchedDigits: string) {
    matches.push({
      id,
      name: PRIZE_NAMES[id],
      amount: PRIZE_AMOUNTS[id],
      matchedDigits,
    })
  }

  // 1. รางวัลที่ 1 — exact 6-digit match
  if (ticket === draw.first) {
    push('first', ticket)
  }

  // 2. รางวัลข้างเคียงรางวัลที่ 1 — ±1, NO wraparound
  const firstNum = parseInt(draw.first, 10)
  const adjacentBelow = firstNum > 0 ? (firstNum - 1).toString().padStart(6, '0') : null
  const adjacentAbove = firstNum < 999999 ? (firstNum + 1).toString().padStart(6, '0') : null
  if ((adjacentBelow && ticket === adjacentBelow) || (adjacentAbove && ticket === adjacentAbove)) {
    push('adjacent', ticket)
  }

  // 3. รางวัลที่ 2
  if (draw.second.includes(ticket)) push('second', ticket)

  // 4. รางวัลที่ 3
  if (draw.third.includes(ticket)) push('third', ticket)

  // 5. รางวัลที่ 4
  if (draw.fourth.includes(ticket)) push('fourth', ticket)

  // 6. รางวัลที่ 5
  if (draw.fifth.includes(ticket)) push('fifth', ticket)

  // 7. เลขหน้า 3 ตัว — first 3 digits
  const front3 = ticket.slice(0, 3)
  if (draw.front3.includes(front3)) push('front3', front3)

  // 8. เลขท้าย 3 ตัว — last 3 digits
  const back3 = ticket.slice(3)
  if (draw.back3.includes(back3)) push('back3', back3)

  // 9. เลขท้าย 2 ตัว — last 2 digits
  const back2 = ticket.slice(4)
  if (draw.back2.includes(back2)) push('back2', back2)

  return matches
}

export function formatPrizeAmount(amount: number): string {
  return `${amount.toLocaleString('th-TH')} บาท ต่อใบ`
}

const THAI_MONTHS = [
  '', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

export function formatThaiDate(isoDate: string): string {
  const [yearStr, monthStr, dayStr] = isoDate.split('-')
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  const buddhistYear = year + 543
  return `${day} ${THAI_MONTHS[month]} ${buddhistYear}`
}
