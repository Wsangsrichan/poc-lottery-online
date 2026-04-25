export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-md py-lg animate-pulse" aria-label="กำลังโหลดผลรางวัล...">
      <div className="h-5 w-48 bg-gray-200 rounded mx-auto mb-lg" />
      <div className="max-w-sm mx-auto px-md flex flex-col gap-sm mb-2xl">
        <div className="h-12 bg-gray-200 rounded-lg w-full" />
        <div className="h-12 bg-gray-200 rounded-lg w-full" />
      </div>
      <div className="w-full mb-2xl">
        <div className="h-5 w-32 bg-gray-200 rounded mx-4 mb-sm" />
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`flex justify-between px-md py-2 ${i % 2 === 0 ? 'bg-white' : 'bg-surface-2'}`}
          >
            <div className="h-4 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
      <p className="text-sm text-text-muted text-center">กำลังโหลดผลรางวัล...</p>
    </div>
  )
}
