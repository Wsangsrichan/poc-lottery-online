export type PrizeTierId =
  | 'first'
  | 'adjacent'
  | 'second'
  | 'third'
  | 'fourth'
  | 'fifth'
  | 'front3'
  | 'back3'
  | 'back2'

export const PRIZE_NAMES: Record<PrizeTierId, string> = {
  first: 'รางวัลที่ 1',
  adjacent: 'รางวัลข้างเคียงรางวัลที่ 1',
  second: 'รางวัลที่ 2',
  third: 'รางวัลที่ 3',
  fourth: 'รางวัลที่ 4',
  fifth: 'รางวัลที่ 5',
  front3: 'เลขหน้า 3 ตัว',
  back3: 'เลขท้าย 3 ตัว',
  back2: 'เลขท้าย 2 ตัว',
}

export const PRIZE_AMOUNTS: Record<PrizeTierId, number> = {
  first: 2_000_000,
  adjacent: 100_000,
  second: 200_000,
  third: 80_000,
  fourth: 40_000,
  fifth: 20_000,
  front3: 4_000,
  back3: 4_000,
  back2: 2_000,
}

export interface LotteryResult {
  drawDate: string
  drawDateThai: string
  first: string
  second: string[]
  third: string[]
  fourth: string[]
  fifth: string[]
  front3: string[]
  back3: string[]
  back2: string[]
}

export interface PrizeMatch {
  id: PrizeTierId
  name: string
  amount: number
  matchedDigits: string
}

export interface LotteryDataSource {
  getLatest(): Promise<LotteryResult>
}

export interface HistoryEntry {
  ticket: string
  drawDate: string
  drawDateThai: string
  matches: PrizeMatch[]
  checkedAt: string
}
