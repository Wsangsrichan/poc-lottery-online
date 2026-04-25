import { NextResponse } from 'next/server'
import * as cheerio from 'cheerio'
import { parseLotteryResult } from '@/lib/lottery-schema'
import { formatThaiDate } from '@/lib/lottery'
import fallbackData from '@/data/lottery-fallback.json'

export const revalidate = 43200

export async function GET() {
  try {
    const result = await scrapeSanook()
    if (result) {
      return NextResponse.json(result, {
        headers: { 'Cache-Control': 's-maxage=43200, stale-while-revalidate=86400' },
      })
    }
  } catch (err) {
    console.error('[api/lottery] Scraper error:', err)
  }

  console.warn('[api/lottery] Returning static fallback data')
  return NextResponse.json(fallbackData, {
    headers: { 'X-Data-Source': 'static-fallback' },
  })
}

async function scrapeSanook(): Promise<object | null> {
  const res = await fetch('https://lotto.sanook.com/', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LotteryChecker/1.0)' },
    next: { revalidate: 43200 },
  })

  if (!res.ok) {
    console.warn('[api/lottery] sanook.com returned', res.status)
    return null
  }

  const html = await res.text()
  const $ = cheerio.load(html)

  const pageTitle = $('title').text() || ''
  const dateMatch = pageTitle.match(/(\d{1,2})\s+(\S+)\s+(\d{4})/)

  const firstPrizeEl = $(
    '[class*="first-prize"] .prize-number, [class*="1st"] .number, .prize-1 .number'
  ).first()
  const firstPrize = firstPrizeEl.text().trim().replace(/\s+/g, '').padStart(6, '0')

  if (!firstPrize || firstPrize.length !== 6 || !/^\d{6}$/.test(firstPrize)) {
    console.warn('[api/lottery] Could not parse first prize from sanook.com — using fallback')
    return null
  }

  let drawDate = new Date().toISOString().split('T')[0]
  let drawDateThai = formatThaiDate(drawDate)
  if (dateMatch) {
    drawDateThai = dateMatch[0]
  }

  const rawData = {
    drawDate,
    drawDateThai,
    first: firstPrize,
    second: extractNumbers($, '[class*="2nd"], .prize-2', 5, 6),
    third: extractNumbers($, '[class*="3rd"], .prize-3', 10, 6),
    fourth: extractNumbers($, '[class*="4th"], .prize-4', 50, 6),
    fifth: extractNumbers($, '[class*="5th"], .prize-5', 100, 6),
    front3: extractNumbers($, '[class*="front3"], [class*="front-3"]', 2, 3),
    back3: extractNumbers($, '[class*="back3"], [class*="back-3"]', 2, 3),
    back2: extractNumbers($, '[class*="back2"], [class*="back-2"]', 1, 2),
  }

  const validated = parseLotteryResult(rawData)
  return validated
}

function extractNumbers(
  $: ReturnType<typeof cheerio.load>,
  selector: string,
  count: number,
  expectedLength: number
): string[] {
  const numbers: string[] = []
  $(selector).find('.number, [class*="number"]').each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, '')
    if (/^\d+$/.test(text) && text.length === expectedLength) {
      numbers.push(text)
    }
  })
  return numbers.slice(0, count)
}
