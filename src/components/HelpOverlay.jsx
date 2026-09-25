export default function HelpOverlay({ defs, onClose }) {
  const shoot = defs.filter((d) => d.killable)
  const spare = defs.filter((d) => !d.killable)

  return (
    <div className="overlay" onClick={onClose}>
      <div className="help-window" onClick={(e) => e.stopPropagation()}>
        <div className="titlebar">
          <span className="title">What to shoot</span>
          <span className="title-btns"><i onClick={onClose}>×</i></span>
        </div>

        <div className="help-body">
          <p className="core-test">
            <b>One rule:</b> if it glows yellow, a real person is needed. Let it go.
          </p>

          <div className="help-cols">
            <div className="help-col good">
              <h4>🎯 Shoot these</h4>
              <p className="col-note">Boring work. A machine can do it.</p>
              <ul>
                {shoot.map((d) => (
                  <li key={d.id}>
                    <span className="li-icon">{d.icon}</span>
                    <span className="li-label">{d.label}</span>
                    <span className="li-pts">+{d.points}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="help-col bad">
              <h4>🚫 Let these go</h4>
              <p className="col-note">These glow yellow. A person is needed.</p>
              <ul>
                {spare.map((d) => (
                  <li key={d.id}>
                    <span className="li-icon glow">{d.icon}</span>
                    <span className="li-label">{d.label}</span>
                    <span className="li-pen">−{d.penalty}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="help-meters">
            <h4>Keys</h4>
            <p><b>Click</b> to shoot · <b>R</b> to reload early · <b>H</b> for this help · <b>Esc</b> to close</p>
            <p><b>Shots</b> — you get 10, then it reloads by itself.</p>
            <p><b>Trouble</b> — goes up when you shoot something that needed a person. Full means the game ends.</p>
            <p>Work that flies past costs you a few points, so do not just sit still.</p>
          </div>

          <button className="w95-btn primary" onClick={onClose}>Back to the game</button>
        </div>
      </div>
    </div>
  )
}
