'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  const router = useRouter()

  useEffect(() => {
    console.error('[error.tsx]', error)
  }, [error])

  return (
    <main className="max-w-2xl mx-auto px-md py-2xl text-center">
      <h1 className="text-xl font-semibold text-error mb-sm">ไม่สามารถโหลดข้อมูลได้</h1>
      <p className="text-base text-gray-600 mb-lg">
        ข้อมูลผลรางวัลอาจล่าช้า กรุณาลองอีกครั้งในอีกสักครู่
      </p>
      <button
        type="button"
        onClick={() => router.refresh()}
        className="h-12 px-xl rounded-lg bg-gold text-white text-base font-semibold
          hover:brightness-95 active:brightness-90 transition-all duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      >
        ลองอีกครั้ง
      </button>
    </main>
  )
}
