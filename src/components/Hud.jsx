import { MAGAZINE, TROUBLE_MAX } from '../game.js'

export default function Hud({ state }) {
  const secs = Math.ceil(Math.max(0, state.duration - state.t) / 1000)
  const pct = Math.min(100, (state.trouble / TROUBLE_MAX) * 100)

  return (
    <div className="hud">
      <div className="score-box">
        <span className="box-label">Points</span>
        <span className="box-value">{state.score}</span>
      </div>

      <div className={`timer ${secs <= 10 ? 'low' : ''}`}>
        <span className="box-label">Time</span>
        <span className="box-value">0:{String(secs).padStart(2, '0')}</span>
      </div>

      <div className="meter-box" title="Shooting things that need a person fills this. Full means game over.">
        <div className="meter-top">
          <span>Trouble</span>
          <span>{Math.round(pct)}%</span>
        </div>
        <div className="meter-track">
          <div className={`meter-fill ${pct >= 60 ? 'danger' : ''}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="ammo-box" title="10 shots, then it reloads by itself. Press R to reload early.">
        <span className="box-label">Shots</span>
        <span className="ammo-dots">
          {Array.from({ length: MAGAZINE }).map((_, i) => (
            <i key={i} className={i < state.ammo ? 'full' : 'spent'} />
          ))}
        </span>
      </div>

      {state.combo >= 3 && <div className="combo-flag">×{state.combo} in a row!</div>}
    </div>
  )
}

export function Ticker({ events }) {
  return (
    <div className="ticker">
      {events.length === 0 && (
        <div className="tick idle">Shoot the boring work. Let the yellow ones go.</div>
      )}
      {events.slice().reverse().map((e) => (
        <div className={`tick k-${e.kind}`} key={e.id}>
          {e.label && <b>{e.label}</b>}
          <span>{e.text}</span>
          <span className="tick-delta">{e.delta > 0 ? `+${e.delta}` : e.delta}</span>
        </div>
      ))}
    </div>
  )
}
