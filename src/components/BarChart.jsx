// Kichik, kutubxonasiz ustunli grafik. data: [{ day: 'YYYY-MM-DD', count }]
export default function BarChart({ data, label }) {
  const max = Math.max(1, ...data.map((d) => d.count))
  const w = 300
  const h = 80
  const bw = w / data.length
  const total = data.reduce((s, d) => s + d.count, 0)
  return (
    <figure style={{ margin: 0 }}>
      <svg className="chart" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" role="img" aria-label={`${label}: oxirgi 30 kunda ${total}`}>
        {data.map((d, i) => {
          const bh = Math.max(d.count > 0 ? 2 : 0, (d.count / max) * (h - 4))
          return (
            <rect key={d.day} className="chart__bar" x={i * bw + 1} y={h - bh} width={Math.max(1, bw - 2)} height={bh} rx="1">
              <title>{`${d.day}: ${d.count}`}</title>
            </rect>
          )
        })}
      </svg>
      <figcaption className="muted">
        {label}: jami {total}
      </figcaption>
    </figure>
  )
}
