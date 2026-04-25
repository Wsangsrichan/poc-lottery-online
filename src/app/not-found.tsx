import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="max-w-2xl mx-auto px-md py-2xl text-center">
      <h1 className="text-xl font-semibold text-text mb-sm">ไม่พบหน้าที่ต้องการ</h1>
      <p className="text-base text-text-muted mb-lg">หน้านี้ไม่มีในระบบ</p>
      <Link
        href="/"
        className="inline-flex items-center h-12 px-xl rounded-lg bg-gold text-white
          text-base font-semibold hover:brightness-95 transition-all duration-150"
      >
        กลับหน้าหลัก
      </Link>
    </main>
  )
}
