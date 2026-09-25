import { useRef, useState } from 'react'

export default function Arena({ state, onShoot }) {
  const ref = useRef(null)
  const [cross, setCross] = useState({ x: 50, y: 50, on: false })
  const [marks, setMarks] = useState([])

  function toPct(e) {
    const r = ref.current.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    }
  }

  function handleMove(e) {
    setCross({ ...toPct(e), on: true })
  }

  function handleClick(e) {
    const p = toPct(e)
    const id = Date.now() + Math.random()
    setMarks((m) => [...m.slice(-5), { ...p, id }])
    setTimeout(() => setMarks((m) => m.filter((x) => x.id !== id)), 300)
    onShoot(p.x, p.y)
  }

  const dry = state.ammo <= 0 || state.reloadingUntil > 0

  return (
    <div
      ref={ref}
      className={`arena ${dry ? 'dry' : ''}`}
      onMouseMove={handleMove}
      onMouseLeave={() => setCross((c) => ({ ...c, on: false }))}
      onClick={handleClick}
    >
      <div className="cubicles" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, i) => <span key={i} />)}
      </div>

      {state.objects.map((o) => (
        <div
          key={o.uid}
          className={`target ${o.def.killable ? 'work' : 'person'} ${o.mode === 'pop' ? 'popping' : ''}`}
          style={{
            left: `${o.x}%`,
            top: `${o.y}%`,
            fontSize: `${o.def.size * 0.62}cqw`,
          }}
        >
          <span className="target-icon">{o.def.icon}</span>
          <span className="target-label">{o.def.label}</span>
        </div>
      ))}

      {state.popups.map((p) => (
        <span key={p.id} className={`popup p-${p.kind}`} style={{ left: `${p.x}%`, top: `${p.y}%` }}>
          {p.text}
        </span>
      ))}

      {marks.map((m) => (
        <span key={m.id} className="shot-mark" style={{ left: `${m.x}%`, top: `${m.y}%` }} />
      ))}

      {cross.on && (
        <span className={`crosshair ${dry ? 'empty' : ''}`} style={{ left: `${cross.x}%`, top: `${cross.y}%` }} />
      )}

      {state.reloadingUntil > 0 && <div className="reload-banner">Reloading…</div>}
    </div>
  )
}
