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
    <div className="max-w-2xl mx-auto px-sm py-md">
      <div className="rounded-2xl bg-white/70 backdrop-blur-sm shadow-card-lg border border-white/50 p-2xl text-center">
        <div className="h-1 w-12 mx-auto rounded-full bg-gradient-to-r from-error/30 via-error to-error/30 mb-lg" />
        <h1 className="text-xl font-semibold text-error mb-sm">ไม่สามารถโหลดข้อมูลได้</h1>
        <p className="text-base text-text-muted mb-lg">
          ข้อมูลผลรางวัลอาจล่าช้า กรุณาลองอีกครั้งในอีกสักครู่
        </p>
        <button
          type="button"
          onClick={() => router.refresh()}
          className="h-12 px-xl rounded-xl bg-lottery-green
            text-white text-base font-semibold shadow-sm
            hover:bg-lottery-green-dark active:brightness-90 transition-all duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lottery-green/50"
        >
          ลองอีกครั้ง
        </button>
      </div>
    </div>
  )
}
