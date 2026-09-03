function ScoreMark({ score, event }) {
  return (
    <div className="score-mark" aria-label={`${event} score ${score} out of 100`}>
      <div className="score-ring">
        <span className="score-number">{score}</span>
        <span className="score-denominator">/100</span>
      </div>
      <span className="score-label">{event} potential</span>
    </div>
  )
}

export default ScoreMark
