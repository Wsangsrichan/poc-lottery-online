import type { LotteryDataSource, LotteryResult } from './types'
import { parseLotteryResult } from './lottery-schema'
import fallbackData from '@/data/lottery-fallback.json'

export class StaticDataSource implements LotteryDataSource {
  async getLatest(): Promise<LotteryResult> {
    const result = parseLotteryResult(fallbackData)
    if (!result) throw new Error('Static fallback data failed Zod validation')
    return result
  }
}

export class ScraperDataSource implements LotteryDataSource {
  async getLatest(): Promise<LotteryResult> {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? ''
      const res = await fetch(`${baseUrl}/api/lottery`, {
        next: { revalidate: 43200 },
      })
      if (!res.ok) throw new Error(`Scraper route returned ${res.status}`)
      const raw = await res.json()
      const result = parseLotteryResult(raw)
      if (!result) throw new Error('Scraper data failed Zod validation')
      return result
    } catch (err) {
      console.warn('[lottery-api] ScraperDataSource failed, using static fallback:', err)
      return new StaticDataSource().getLatest()
    }
  }
}

export async function fetchLotteryData(): Promise<LotteryResult> {
  const source = process.env.LOTTERY_DATA_SOURCE ?? 'scraper'
  if (source === 'static') {
    return new StaticDataSource().getLatest()
  }
  return new ScraperDataSource().getLatest()
}
