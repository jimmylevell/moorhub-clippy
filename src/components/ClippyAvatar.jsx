export function heatStage(heat) {
  if (heat >= 100) return 'fried'
  if (heat >= 75) return 'smoking'
  if (heat >= 50) return 'hot'
  if (heat >= 25) return 'warm'
  return 'idle'
}

export default function ClippyAvatar({ heat, bubble }) {
  const stage = heatStage(heat)

  return (
    <div className="clippy-zone">
      <div className={`clippy-wrap stage-${stage}`}>
        {(stage === 'warm' || stage === 'hot') && <span className="sweat">💧</span>}
        {stage === 'hot' && <span className="sweat two">💧</span>}
        {stage === 'smoking' && (
          <span className="smoke">
            <i>~</i><i>~</i><i>~</i>
          </span>
        )}
        {stage === 'fried' && <span className="spark">⚡</span>}

        <svg viewBox="0 0 200 250" className="clippy-svg" aria-label="Clippy">
          <path
            d="M70 45 a30 30 0 0 1 60 0 v135 a30 30 0 0 1 -60 0 v-115 a10 10 0 0 1 20 0 v95"
            fill="none" stroke="#5a7fc0" strokeWidth="13" strokeLinecap="round"
          />
          {stage === 'fried' ? (
            <>
              <text x="76" y="80" fontSize="18" fill="#111">×</text>
              <text x="108" y="80" fontSize="18" fill="#111">×</text>
              <path d="M84 100 L100 90 L116 100 L100 110 Z" fill="#111" />
            </>
          ) : (
            <>
              <circle cx="86" cy="72" r="6" fill="#111" />
              <circle cx="114" cy="72" r="6" fill="#111" />
              {stage === 'idle' && <path d="M86 92 Q100 102 114 92" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />}
              {stage === 'warm' && <path d="M86 94 h28" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />}
              {stage === 'hot' && <path d="M86 98 Q100 88 114 98" fill="none" stroke="#111" strokeWidth="3" strokeLinecap="round" />}
              {stage === 'smoking' && <ellipse cx="100" cy="96" rx="9" ry="11" fill="#111" />}
            </>
          )}
        </svg>
      </div>

      <div className="bubble">{bubble}</div>
    </div>
  )
}
