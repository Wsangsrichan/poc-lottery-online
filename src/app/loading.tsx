export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-sm py-md animate-pulse" aria-label="กำลังโหลดผลรางวัล...">
      <div className="text-center py-lg mb-lg">
        <div className="h-1 w-12 mx-auto rounded-full bg-lottery-green-light mb-md" />
        <div className="h-6 w-40 bg-gray-200 rounded mx-auto mb-sm" />
        <div className="h-4 w-56 bg-gray-100 rounded mx-auto" />
      </div>
      <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/50 p-lg mb-2xl">
        <div className="max-w-sm mx-auto flex flex-col gap-sm">
          <div className="h-14 bg-gray-100 rounded-xl w-full" />
          <div className="h-13 bg-lottery-green-light rounded-xl w-full" />
        </div>
      </div>
      <div className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/50 p-md">
        <div className="h-5 w-32 bg-gray-200 rounded mb-sm" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`flex justify-between px-md py-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-2/50'}`}
          >
            <div className="h-4 bg-gray-100 rounded w-1/3" />
            <div className="h-4 bg-gray-100 rounded w-1/4" />
          </div>
        ))}
      </div>
      <p className="text-sm text-text-muted text-center mt-lg">กำลังโหลดผลรางวัล...</p>
    </div>
  )
}
