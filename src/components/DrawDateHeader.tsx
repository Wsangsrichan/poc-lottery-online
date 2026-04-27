interface DrawDateHeaderProps {
  drawDateThai: string
}

export default function DrawDateHeader({ drawDateThai }: DrawDateHeaderProps) {
  return (
    <header className="text-center py-sm px-md mb-sm">
      <p className="text-sm text-text-muted">
        งวดประจำวันที่ <span className="font-semibold text-text">{drawDateThai}</span>
      </p>
    </header>
  )
}
