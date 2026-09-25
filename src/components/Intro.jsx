const CARDS = [
  {
    art: ['📋', '🧾', '🗂️'],
    tone: 'good',
    title: 'Shoot the boring work',
    body: 'Reports. Renaming files. Turning receipts into a table. A machine can do these fine. Click them to win points.',
  },
  {
    art: ['🧑‍💼', '⚖️', '🧠'],
    tone: 'bad',
    title: 'Let the yellow ones go',
    body: 'Anything that needs a real person glows yellow. A review. Legal. An intern learning. Shoot one and you lose a lot of points.',
  },
  {
    art: ['🖱️', '🔫', '⏱️'],
    tone: 'plain',
    title: 'That is the whole game',
    body: 'Click to shoot. You get 10 shots, then it reloads by itself. You have one minute. Things fly in from the sides and pop up from the bottom.',
  },
]

export default function Intro({ stepIndex, onNext, onSkip }) {
  const card = CARDS[stepIndex]
  const last = stepIndex === CARDS.length - 1

  return (
    <div className="overlay">
      <div className="intro-window">
        <div className="titlebar">
          <span className="title">How to play ({stepIndex + 1} of {CARDS.length})</span>
          <span className="title-btns"><i onClick={onSkip}>×</i></span>
        </div>

        <div className={`intro-body tone-${card.tone}`}>
          <div className="intro-art">
            {card.art.map((a, i) => (
              <span key={i} className={`art-chip chip-${card.tone}`}>{a}</span>
            ))}
          </div>
          <h2>{card.title}</h2>
          <p>{card.body}</p>

          <div className="intro-dots">
            {CARDS.map((_, i) => <i key={i} className={i === stepIndex ? 'on' : ''} />)}
          </div>

          <div className="intro-buttons">
            <button className="w95-btn primary" onClick={onNext}>
              {last ? 'Start' : 'Next'}
            </button>
            {!last && <button className="w95-btn" onClick={onSkip}>Skip</button>}
          </div>
        </div>
      </div>
    </div>
  )
}

export const INTRO_STEPS = CARDS.length
