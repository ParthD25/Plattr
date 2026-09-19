// Score number + grade pill + bar, as in the design. Shared file: builders import, do not edit.
import { GRADE_COLOR } from '../passport/score'
import type { Score } from '../passport/types'

export function ScoreBadge({ score, label = 'Plattr score' }: { score: Score; label?: string }) {
  const color = GRADE_COLOR[score.grade]
  return (
    <div>
      <div className="score-head">
        <div>
          <strong>{label}</strong>
          <div className="score-num">{score.total}<small> /100</small></div>
        </div>
        <span className="grade-pill" style={{ color, background: `${color}22` }}>Grade {score.grade} · {score.word}</span>
      </div>
      <div className="bar" role="img" aria-label={`${score.total} out of 100`}><span style={{ width: `${score.total}%`, background: color }} /></div>
    </div>
  )
}

/** Small inline grade for lists. */
export function GradeDot({ score }: { score: Score }) {
  return <span className="grade-pill" style={{ color: GRADE_COLOR[score.grade], background: `${GRADE_COLOR[score.grade]}22` }}>{score.total} · {score.grade}</span>
}
