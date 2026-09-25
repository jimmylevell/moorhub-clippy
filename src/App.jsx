import { useEffect, useRef, useState } from 'react'
import { createGame, startGame, showIntro, step, shoot, reload, setPaused, isReloading, MAGAZINE } from './game.js'
import Arena from './components/Arena.jsx'
import Hud, { Ticker } from './components/Hud.jsx'
import GameOver from './components/GameOver.jsx'
import HelpOverlay from './components/HelpOverlay.jsx'
import Intro, { INTRO_STEPS } from './components/Intro.jsx'
import ClippyAvatar from './components/ClippyAvatar.jsx'

const SEEN_KEY = 'clippy-open-season-seen-intro'

function hasSeenIntro() {
  try { return localStorage.getItem(SEEN_KEY) === '1' } catch { return false }
}
function markSeen() {
  try { localStorage.setItem(SEEN_KEY, '1') } catch { /* private mode, no problem */ }
}

export default function App() {
  const [game, setGame] = useState(() => createGame())
  const [introStep, setIntroStep] = useState(0)
  const ref = useRef(game)
  ref.current = game

  const apply = (fn) => {
    const next = fn(ref.current)
    ref.current = next
    setGame(next)
  }

  // First time here? Walk through the three cards. After that, straight in.
  function begin() {
    if (hasSeenIntro()) return apply(startGame)
    setIntroStep(0)
    apply(showIntro)
  }

  function introNext() {
    if (introStep < INTRO_STEPS - 1) return setIntroStep(introStep + 1)
    markSeen()
    apply(startGame)
  }

  function introSkip() {
    markSeen()
    apply(startGame)
  }

  useEffect(() => {
    if (game.phase !== 'playing') return
    let raf
    let last = performance.now()
    const loop = (now) => {
      const dt = Math.min(48, now - last)
      last = now
      apply((s) => step(s, dt))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [game.phase])

  useEffect(() => {
    function onKey(e) {
      const k = e.key.toLowerCase()
      const s = ref.current
      if (s.phase === 'intro') {
        if (k === 'enter' || k === ' ') introNext()
        return
      }
      if (s.phase !== 'playing') {
        if (k === 'enter' || k === ' ') begin()
        return
      }
      if (k === 'escape') return apply((g) => setPaused(g, false))
      if (k === 'h' || k === '?') return apply((g) => setPaused(g, !g.paused))
      if (k === 'r') return apply(reload)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const lastEvent = game.events[game.events.length - 1]

  return (
    <div className="desktop">
      <div className="window">
        <div className="titlebar">
          <span className="title">
            Clippy — Helpful Assistant{game.phase === 'over' ? ' (Not Responding)' : ''}
          </span>
          <span className="title-btns">
            {game.phase === 'playing' && (
              <i className="help-btn" title="Help (H)" onClick={() => apply((g) => setPaused(g, true))}>?</i>
            )}
            <i>_</i><i>□</i><i>×</i>
          </span>
        </div>

        <div className="window-body">
          {(game.phase === 'menu' || game.phase === 'intro') && (
            <div className="menu">
              <ClippyAvatar heat={0} bubble="It looks like you are trying to automate your co-workers. Want a hand?" />
              <h1>Clippy: Open Season</h1>
              <p className="pitch">
                Boring work flies past. So do jobs that need a real person.
                Shoot the boring work. Let the people go.
              </p>

              <div className="menu-legend">
                <div className="lg good">
                  <span className="lg-icons">📋 🧾 🗂️</span>
                  <b>Shoot these</b> — reports, file renaming, tidying tables. <em>+10 points</em>
                </div>
                <div className="lg bad">
                  <span className="lg-icons glow">🧑‍💼 ⚖️ 🧠</span>
                  <b>Not these</b> — they glow yellow. A person is needed. <em>−25 points</em>
                </div>
              </div>

              <button className="w95-btn primary" onClick={begin}>Start</button>
              <p className="tiny">
                Click to shoot · {MAGAZINE} shots, reloads by itself · one minute
                <br />
                <button className="link-btn" onClick={() => { setIntroStep(0); apply(showIntro) }}>
                  How to play
                </button>
              </p>
            </div>
          )}

          {game.phase === 'playing' && (
            <div className="play">
              <Hud state={game} />
              <Arena state={game} onShoot={(x, y) => apply((g) => shoot(g, x, y))} />
              <div className="underbar">
                <div className="mini-clippy">
                  <ClippyAvatar
                    heat={game.trouble}
                    bubble={lastEvent ? lastEvent.text : 'Shoot the boring stuff.'}
                  />
                </div>
                <Ticker events={game.events} />
              </div>
            </div>
          )}

          {game.phase === 'over' && <GameOver state={game} onRestart={begin} />}
        </div>

        <div className="statusbar">
          <span>
            {game.paused
              ? 'Paused.'
              : game.phase === 'playing'
                ? isReloading(game) ? 'Reloading…' : 'Clippy is taking aim.'
                : 'Ready.'}
          </span>
          <span>{game.phase === 'playing' ? 'R reload · H help' : 'Internal easter egg'}</span>
        </div>
      </div>

      {game.phase === 'intro' && (
        <Intro stepIndex={introStep} onNext={introNext} onSkip={introSkip} />
      )}
      {game.paused && <HelpOverlay defs={game.defs} onClose={() => apply((g) => setPaused(g, false))} />}
    </div>
  )
}
