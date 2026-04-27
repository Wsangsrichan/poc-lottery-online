import { fetchLotteryData } from '@/lib/lottery-api'
import DrawDateHeader from '@/components/DrawDateHeader'
import PrizeTable from '@/components/PrizeTable'
import LotteryPageClient from './LotteryPageClient'

// ISR: cache for 12 hours, revalidate in background
export const revalidate = 43200

interface PageProps {
  searchParams: Promise<{ ticket?: string }>
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams
  const initialTicket = params.ticket?.replace(/\D/g, '').slice(0, 6) ?? ''

  const draw = await fetchLotteryData()

  return (
    <main className="max-w-[640px] mx-auto py-sm pb-3xl px-sm">
      <DrawDateHeader drawDateThai={draw.drawDateThai} />
      <LotteryPageClient draw={draw} initialTicket={initialTicket} />
      <section className="mt-2xl">
        <PrizeTable draw={draw} />
      </section>
    </main>
  )
}
