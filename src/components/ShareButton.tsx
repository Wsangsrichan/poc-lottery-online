'use client'

import { useState, useCallback } from 'react'

interface ShareButtonProps {
  ticket: string
  won: boolean
}

export default function ShareButton({ ticket, won }: ShareButtonProps) {
  const [toastVisible, setToastVisible] = useState(false)

  const handleShare = useCallback(async () => {
    const url = window.location.href
    const resultText = won ? 'ถูกรางวัล!' : 'ไม่ถูกรางวัล'
    const shareData = {
      title: 'ผลตรวจสลาก',
      text: `หมายเลข ${ticket} — ${resultText}`,
      url,
    }

    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData)
        return
      } catch {
        // User cancelled — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setToastVisible(true)
      setTimeout(() => setToastVisible(false), 2000)
    } catch {
      // Clipboard unavailable — silent fail
    }
  }, [ticket, won])

  return (
    <>
      <button
        type="button"
        onClick={handleShare}
        className="h-11 w-full rounded-lg border border-border bg-surface text-gray-700
          text-base font-normal px-md
          hover:bg-surface-2 active:brightness-95
          transition-colors duration-150
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        aria-label="แชร์ผลลัพธ์"
      >
        แชร์ผลลัพธ์
      </button>

      {toastVisible && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50
            bg-gray-900 text-white text-sm rounded-full px-4 py-2
            pointer-events-none"
        >
          คัดลอกลิงก์แล้ว
        </div>
      )}
    </>
  )
}
