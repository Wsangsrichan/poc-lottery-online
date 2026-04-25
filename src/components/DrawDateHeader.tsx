interface DrawDateHeaderProps {
  drawDateThai: string
}

export default function DrawDateHeader({ drawDateThai }: DrawDateHeaderProps) {
  return (
    <div className="text-center py-3">
      <p className="text-base text-text-muted font-sans">
        งวดประจำวันที่ <span className="font-semibold text-text">{drawDateThai}</span>
      </p>
    </div>
  )
}
