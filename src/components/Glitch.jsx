const LINES = [
  'SYSTEM NOTICE: unusually high output detected.',
  'Reviewing operator performance…',
  'This role can be done faster.',
  'Reassigning roles.',
]

export default function Glitch({ progress }) {
  // progress runs 0 -> 1 across the transition
  const shown = Math.min(LINES.length, Math.floor(progress * (LINES.length + 0.6)) + 1)

  return (
    <div className="glitch">
      <div className="glitch-scan" />
      <div className="glitch-lines">
        {LINES.slice(0, shown).map((l, i) => (
          <p key={i} className={i === LINES.length - 1 ? 'final' : ''}>
            {i === LINES.length - 1 ? l : `> ${l}`}
          </p>
        ))}
      </div>
      {progress > 0.82 && <div className="glitch-flash" />}
    </div>
  )
}
