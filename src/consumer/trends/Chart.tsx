// One small inline-SVG chart used for every trend on the page: a line with dots, or columns. One series, one colour, one y axis from zero.
// Gaps stay gaps: a null value draws nothing and breaks the line. Every chart carries a text summary and a table of its numbers.
import { useState, type PointerEvent } from 'react'
import { fmt, fmtDay } from './series'

export interface ChartPoint { date: string; value: number | null; label?: string }

interface Props {
  title: string
  unit: string
  points: ChartPoint[]
  /** The arithmetic sentence shown under the chart and read out as the chart's text alternative. */
  describe: string
  kind?: 'line' | 'columns'
  reference?: { value: number; label: string }
  yMax?: number
  /** This date's mark is drawn larger and its axis label reads "Today". */
  todayIso?: string
  withYear?: boolean
  /** Slate ink instead of the series blue - for lab values, where no colour should hint at good or bad. */
  neutral?: boolean
  valueHeader?: string
}

const W = 340, H = 190, L = 42, R = 14, T = 28, B = 26
const PLOT_W = W - L - R, PLOT_H = H - T - B
const r1 = (n: number) => Math.round(n * 10) / 10

/** Clean y ticks from zero: 0 / 1,000 / 2,000 / 3,000. */
function ticks(max: number): number[] {
  const raw = Math.max(max, 1) / 3, pow = 10 ** Math.floor(Math.log10(raw))
  const step = [1, 2, 2.5, 5, 10].find(m => m * pow >= raw)! * pow
  return Array.from({ length: Math.ceil(Math.max(max, 1) / step) + 1 }, (_, i) => i * step)
}

export function Chart({ title, unit, points, describe, kind = 'line', reference, yMax, todayIso, withYear, neutral, valueHeader }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const n = points.length, band = PLOT_W / n
  const loggedIdx = points.flatMap((p, i) => (p.value === null ? [] : [i]))
  const tk = ticks(yMax ?? Math.max(reference?.value ?? 0, ...loggedIdx.map(i => points[i].value!)))
  const top = tk[tk.length - 1]
  const x = (i: number) => r1(L + band * (i + 0.5))
  const y = (v: number) => r1(T + PLOT_H * (1 - v / top))
  const lastLogged = loggedIdx[loggedIdx.length - 1]
  const dense = n > 8
  const dayName = (p: ChartPoint) => (p.date === todayIso ? 'Today' : fmtDay(p.date, withYear))

  const line = points.reduce((d, p, i) => (p.value === null ? d : `${d}${i > 0 && points[i - 1].value !== null ? 'L' : 'M'}${x(i)},${y(p.value)}`), '')
  const colW = Math.min(24, Math.max(3, band - 2))
  const column = (i: number, v: number) => {
    const x0 = r1(x(i) - colW / 2), yv = y(v), base = T + PLOT_H, rad = Math.min(4, colW / 2, base - yv)
    return `M${x0},${base}V${yv + rad}Q${x0},${yv} ${x0 + rad},${yv}H${x0 + colW - rad}Q${x0 + colW},${yv} ${x0 + colW},${yv + rad}V${base}Z`
  }

  // Direct labels are sparing: the points that bring their own label (trips, lab values), otherwise only the latest logged value.
  const labelled = points.some(p => p.label) ? loggedIdx.filter(i => points[i].label) : lastLogged === undefined ? [] : [lastLogged]
  const xLabelIdx = band >= (withYear ? 68 : 46) ? points.map((_, i) => i) : [...new Set([0, Math.floor((n - 1) / 2), n - 1])]
  const anchor = (i: number) => (dense && i === n - 1 ? 'end' : dense && i === 0 ? 'start' : 'middle')
  // A label goes above its mark, except in a dip of the line (neighbours higher), where above would sit on the line - there it goes below.
  const labelY = (i: number) => {
    const v = points[i].value!, yv = y(v)
    const near = [points[i - 1]?.value, points[i + 1]?.value].filter((m): m is number => typeof m === 'number')
    const dip = kind === 'line' && near.length > 0 && near.every(m => m > v) && yv + 22 < T + PLOT_H
    return kind === 'columns' ? yv - 6 : dip ? yv + 19 : yv - 11
  }
  const anchorX = (i: number) => (anchor(i) === 'end' ? W - R + 8 : anchor(i) === 'start' ? L : x(i))

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const at = ((e.clientX - box.left) / box.width * W - L) / band - 0.5
    setHover(loggedIdx.length ? loggedIdx.reduce((best, i) => (Math.abs(i - at) < Math.abs(best - at) ? i : best)) : null)
  }
  const shown = hover ?? lastLogged

  return (
    <figure className={`tr-chart${neutral ? ' tr-neutral' : ''}`}>
      <div className="tr-chart-head">
        <h3>{title}</h3>
        {shown !== undefined && <p className="tr-readout"><span>{dayName(points[shown])}</span> <strong>{points[shown].label ?? `${fmt(points[shown].value!)} ${unit}`}</strong></p>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}. ${describe}`} onPointerMove={onMove} onPointerDown={onMove} onPointerLeave={() => setHover(null)}>
        {tk.map(t => (
          <g key={t}>
            <line className="tr-grid-line" x1={L} x2={W - R} y1={y(t)} y2={y(t)} />
            <text className="tr-tick" x={L - 6} y={y(t) + 3.5} textAnchor="end">{fmt(t)}</text>
          </g>
        ))}
        {xLabelIdx.map(i => (
          <text key={i} className={`tr-tick${points[i].date === todayIso ? ' tr-today' : ''}`} x={anchor(i) === 'end' ? W - R : anchorX(i)} y={H - 8} textAnchor={anchor(i)}>{dayName(points[i])}</text>
        ))}
        {reference && <line className="tr-ref" x1={L} x2={W - R} y1={y(reference.value)} y2={y(reference.value)} />}
        {hover !== null && <line className="tr-cross" x1={x(hover)} x2={x(hover)} y1={T} y2={T + PLOT_H} />}
        {kind === 'line' && <path className="tr-line" d={line} />}
        {loggedIdx.map(i => {
          const v = points[i].value!, big = points[i].date === todayIso, hot = hover === i
          return kind === 'columns'
            ? <path key={i} className={`tr-col${hot ? ' tr-hot' : ''}${big ? ' tr-now' : ''}`} d={column(i, v)} />
            : <circle key={i} className={`tr-dot${hot ? ' tr-hot' : ''}`} cx={x(i)} cy={y(v)} r={(big ? 6 : 4) + (hot ? 1.5 : 0)} />
        })}
        {reference && <text className="tr-ref-label" x={L + 4} y={y(reference.value) - 5}>{reference.label}</text>}
        {labelled.map(i => (
          <text key={i} className="tr-value" x={anchorX(i)} y={labelY(i)} textAnchor={anchor(i)}>{points[i].label ?? fmt(points[i].value!)}</text>
        ))}
      </svg>
      <figcaption>{describe}</figcaption>
      <details>
        <summary>Show the numbers</summary>
        <table>
          <caption className="tr-sr">{title}</caption>
          <thead><tr><th scope="col">Date</th><th scope="col">{valueHeader ?? `${title} (${unit})`}</th></tr></thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i}><th scope="row">{fmtDay(p.date, true)}{p.date === todayIso ? ' (today)' : ''}</th><td>{p.value === null ? 'not logged' : p.label ?? `${fmt(p.value)} ${unit}`}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
