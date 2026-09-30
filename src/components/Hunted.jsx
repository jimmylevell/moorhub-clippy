import { useRef } from 'react'
import { LIVES, BLAST_R, Y_SCALE } from '../hunted.js'

export default function Hunted({ hunt, onMouse }) {
  const ref = useRef(null)
  const left = Math.max(0, hunt.duration - hunt.t)
  const invuln = hunt.t < hunt.invulnUntil

  function handleMove(e) {
    const r = ref.current.getBoundingClientRect()
    onMouse({
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    })
  }

  return (
    <div className="hunt-wrap">
      <div className="hunt-hud">
        <div className="hunt-box">
          <span className="box-label">Survive</span>
          <span className="box-value">{(left / 1000).toFixed(1)}s</span>
        </div>
        <div className="hunt-lives">
          {Array.from({ length: LIVES }).map((_, i) => (
            <span key={i} className={i < hunt.lives ? 'life' : 'life gone'}>📎</span>
          ))}
        </div>
        <div className="hunt-note">Move the mouse. Do not stand still.</div>
      </div>

      <div ref={ref} className="arena hunt-arena" onMouseMove={handleMove}>
        <div className="cubicles" aria-hidden="true">
          {Array.from({ length: 9 }).map((_, i) => <span key={i} />)}
        </div>

        {/* crosshairs locking on */}
        {hunt.lockers.map((l) => {
          const p = Math.min(1, (hunt.t - l.born) / l.lockMs)
          return (
            <div key={l.uid} className="locker" style={{ left: `${l.x}%`, top: `${l.y}%` }}>
              <span
                className="locker-ring"
                style={{
                  width: `${BLAST_R * 2 * (2.2 - p * 1.2)}cqw`,
                  height: `${BLAST_R * 2 * (2.2 - p * 1.2)}cqw`,
                  opacity: 0.35 + p * 0.65,
                }}
              />
              <span className="locker-target" style={{ width: `${BLAST_R * 2}cqw`, height: `${BLAST_R * 2}cqw` }} />
              <span className="locker-label">{l.label}</span>
            </div>
          )
        })}

        {/* the shots that already went off */}
        {hunt.blasts.map((b) => (
          <span
            key={b.uid}
            className={`blast ${b.caught ? 'caught' : ''}`}
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${BLAST_R * 2}cqw`, height: `${BLAST_R * 2}cqw` }}
          />
        ))}

        {/* you */}
        <div
          className={`runner ${invuln ? 'hurt' : ''}`}
          style={{ left: `${hunt.player.x}%`, top: `${hunt.player.y}%` }}
        >
          <span className="runner-icon">📎</span>
          <span className="runner-label">You</span>
        </div>
      </div>
    </div>
  )
}
