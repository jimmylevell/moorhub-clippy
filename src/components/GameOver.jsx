import { ENDINGS, getVerdict } from '../game.js'

export default function GameOver({ state, onRestart }) {
  const end = ENDINGS[state.ending]
  const v = getVerdict(state)

  const worst = Object.entries(state.stats.byId)
    .filter(([, r]) => r.bad > 0)
    .sort((a, b) => b[1].bad - a[1].bad)
    .slice(0, 3)
    .map(([id, r]) => ({ id, ...r, def: state.defs.find((d) => d.id === id) }))

  return (
    <div className="over">
      <h2>{end.title}</h2>
      <p className="over-line">{end.line}</p>

      <div className="review">
        <div className="grade">{v.grade}</div>
        <div className="review-body">
          <h3>{v.title}</h3>
          <p>{v.body}</p>
        </div>
      </div>

      <table className="tally">
        <tbody>
          <tr><td>Points</td><td>{state.score}</td></tr>
          <tr><td>Boring work shot</td><td>{state.stats.good}</td></tr>
          <tr className={state.stats.bad ? 'row-bad' : ''}>
            <td>People-things shot</td><td>{state.stats.bad}</td>
          </tr>
          <tr><td>Work that got away</td><td>{state.stats.escaped}</td></tr>
          <tr><td>Best run in a row</td><td>×{state.bestCombo}</td></tr>
        </tbody>
      </table>

      {worst.length > 0 && (
        <div className="regrets">
          <h4>You should not have shot these</h4>
          <ul>
            {worst.map((w) => (
              <li key={w.id}>
                <span className="regret-icon">{w.def?.icon}</span>
                {w.def?.label} <em>×{w.bad}</em>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button className="w95-btn primary" onClick={onRestart}>Play again</button>
    </div>
  )
}
