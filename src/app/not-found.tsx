import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-sm py-md">
      <div className="rounded-2xl bg-white/70 backdrop-blur-sm shadow-card-lg border border-white/50 p-2xl text-center">
        <h1 className="text-xl font-semibold text-text mb-sm">ไม่พบหน้าที่ต้องการ</h1>
        <p className="text-base text-text-muted mb-lg">หน้านี้ไม่มีในระบบ</p>
        <Link
          href="/"
          className="inline-flex items-center h-12 px-xl rounded-xl
            bg-lottery-green text-white
            text-base font-semibold shadow-sm
            hover:bg-lottery-green-dark active:brightness-90 transition-all duration-150
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lottery-green/50"
        >
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  )
}
