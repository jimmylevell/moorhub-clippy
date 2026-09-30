import { TARGETS, normalize, validate, pickTarget, DEFAULTS } from './src/objects.js'
import {
  createGame, startGame, showIntro, step, shoot, reload, setPaused, checkEnd, getVerdict,
  enterHunt, leaveHunt, isRaging,
  MAGAZINE, RELOAD_MS, TROUBLE_MAX, MISS_COST, ROUND_MS, spawnDelay, ENDINGS, POPUP_MS,
  RAGE_SHOTS, RAGE_WINDOW, SURVIVE_BONUS,
} from './src/game.js'
import {
  createHunt, stepHunt, hitsPlayer, waveSize, lockTime, spawnDelay as huntSpawnDelay,
  HUNT_MS, LIVES, BLAST_R, PLAYER_R, HUNTER_LABELS, Y_SCALE,
} from './src/hunted.js'

let pass = 0, fail = 0
const ok = (c, m) => { if (c) { console.log('  PASS', m); pass++ } else { console.log('  FAIL', m); fail++ } }
const section = (t) => console.log('\n' + t)

function seeded(seed = 1) {
  let s = seed
  return () => { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 }
}
function withObject(state, def, extra = {}) {
  return { ...state, objects: [{ uid: 999, def: { ...DEFAULTS, ...def }, mode: 'side', dir: 1, x: 50, y: 50, vy: 0, drift: 0, born: 0, ...extra }] }
}
const KILLABLE = TARGETS.find((t) => t.killable)
const PROTECTED = TARGETS.find((t) => !t.killable)

section('The target list is the extension point')
ok(validate(TARGETS).length === 0, 'the shipped list validates clean')
ok(TARGETS.filter((t) => t.killable).length >= 10, 'enough things to shoot')
ok(TARGETS.filter((t) => !t.killable).length >= 10, 'enough things to spare')
ok(new Set(TARGETS.map((t) => t.id)).size === TARGETS.length, 'all ids unique')

section('A minimal entry still works')
const minimal = [{ id: 'x', label: 'A thing', icon: '📎', killable: true, points: 5 }]
ok(validate(minimal).length === 0, 'a 5-field entry validates')
const n = normalize(minimal)[0]
ok(n.penalty === 20 && n.escape === 3 && n.from === 'both', 'penalty, escape and from default in')
ok(n.weight === 1 && n.speed === 15 && n.size === 9, 'weight, speed and size default in')

section('Broken entries fail loudly')
const bad = (e) => validate([e]).length > 0
ok(bad({ label: 'no id', icon: '📎', killable: true, points: 5 }), 'missing id rejected')
ok(bad({ id: 'a', icon: '📎', killable: true, points: 5 }), 'missing label rejected')
ok(bad({ id: 'a', label: 'x', killable: true, points: 5 }), 'missing icon rejected')
ok(bad({ id: 'a', label: 'x', icon: '📎', points: 5 }), 'missing killable rejected')
ok(bad({ id: 'a', label: 'x', icon: '📎', killable: true }), 'killable with no points rejected')
ok(bad({ id: 'a', label: 'x', icon: '📎', killable: true, points: 5, from: 'sideways' }), 'a bad "from" value is rejected')
ok(bad({ id: 'a', label: 'A'.repeat(40), icon: '📎', killable: true, points: 5 }), 'an over-long label is rejected')
let threw = false
try { createGame([{ id: 'a', label: 'x', icon: '📎' }]) } catch { threw = true }
ok(threw, 'createGame throws rather than starting broken')

section('NEW: things pop up from the bottom')
const popOnly = normalize([{ id: 'p', label: 'Pops', icon: '🎈', killable: true, points: 5, from: 'bottom' }])
let popGame = { ...startGame(createGame()), defs: popOnly, objects: [], nextSpawnAt: 0 }
popGame = step(popGame, 100, seeded(3))
const popped = popGame.objects[0]
ok(popped.mode === 'pop', 'a "from: bottom" object spawns in pop mode')
ok(popped.y > 95, 'it starts below the arena')
ok(popped.vy < 0, 'it starts moving upward')

// let it fly and watch the arc
let arc = popGame
const heights = []
for (let i = 0; i < 26; i++) { arc = step(arc, 100, seeded(9)); const o = arc.objects.find((x) => x.uid === popped.uid); if (o) heights.push(o.y) }
const peak = Math.min(...heights)
ok(peak < 70, `it rises well into the arena (peak y ${peak.toFixed(0)})`)
ok(heights[heights.length - 1] > peak, 'and then falls back down again')

const sideOnly = normalize([{ id: 's', label: 'Slides', icon: '📄', killable: true, points: 5, from: 'side' }])
let sideGame = step({ ...startGame(createGame()), defs: sideOnly, objects: [], nextSpawnAt: 0 }, 100, seeded(3))
ok(sideGame.objects[0].mode === 'side', 'a "from: side" object never pops')
ok(TARGETS.some((t) => t.from === 'bottom'), 'the shipped list uses bottom-poppers')

let both = { ...startGame(createGame()), objects: [], nextSpawnAt: 0 }
const modes = new Set()
let r0 = seeded(21)
for (let i = 0; i < 60; i++) { both = step({ ...both, nextSpawnAt: both.t, objects: [] }, 100, r0); modes.add(both.objects[0].mode) }
ok(modes.has('pop') && modes.has('side'), 'a default list produces both entry styles')

section('A pop-up that falls back counts as escaped')
let falling = { ...popGame, objects: [{ ...popped, y: 111, vy: 50 }] }
falling = step(falling, 100, seeded(4))
ok(falling.stats.escaped === 1, 'falling off the bottom counts as escaped')
ok(falling.score < popGame.score, 'and costs points')

section('Shooting: points are clear and immediate')
let g = startGame(createGame())
let hit = shoot(withObject(g, KILLABLE), 50, 50)
ok(hit.score === KILLABLE.points, `a correct shot scores its points (+${KILLABLE.points})`)
ok(hit.popups.length === 1 && hit.popups[0].text === `+${KILLABLE.points}`, 'a floating "+points" appears at the hit')
ok(hit.popups[0].kind === 'good', 'the popup is marked good')
ok(hit.trouble === 0, 'no trouble from a correct shot')

let oops = shoot(withObject(g, PROTECTED), 50, 50)
ok(oops.score === -PROTECTED.penalty, `a wrong shot costs its penalty (-${PROTECTED.penalty})`)
ok(oops.popups[0].text === `-${PROTECTED.penalty}`, 'a floating "-points" appears at the hit')
ok(oops.trouble === PROTECTED.penalty, 'trouble goes up')
ok(oops.combo === 0, 'the streak resets')

let miss = shoot({ ...g, objects: [] }, 50, 50)
ok(miss.popups[0].kind === 'miss', 'a miss shows a "miss" popup')
ok(miss.score === -MISS_COST, `a miss costs only ${MISS_COST} point`)

let old = { ...hit, t: POPUP_MS + 100 }
ok(step(old, 16, seeded(1)).popups.length === 0, 'popups disappear after a moment')

section('One rule: everything protected is visibly marked')
const defs = normalize(TARGETS)
ok(defs.filter((d) => !d.killable).length === TARGETS.filter((t) => !t.killable).length,
  'every protected object is flagged killable:false, so every one glows')
ok(defs.every((d) => typeof d.killable === 'boolean'), 'there is no third, ambiguous category')
ok(defs.filter((d) => d.killable).every((d) => d.points >= 8), 'every shootable thing is worth at least 8')
ok(defs.filter((d) => !d.killable).every((d) => d.penalty >= 15), 'every protected thing costs at least 15')

section('Simpler: one meter, two normal endings')
ok(Object.keys(ENDINGS).filter((k) => k !== 'automated').length === 2,
  'only two endings in the normal game')
ok(ENDINGS.automated !== undefined, 'plus one that only the secret layer can reach')
ok(checkEnd({ trouble: TROUBLE_MAX, t: 0, duration: ROUND_MS }) === 'trouble', 'full trouble ends it')
ok(checkEnd({ trouble: 0, t: ROUND_MS, duration: ROUND_MS }) === 'timeup', 'the clock ends it')
ok(g.drudgery === undefined, 'the old second meter is gone')
let spree = g
for (let i = 0; i < 5 && spree.phase === 'playing'; i++) spree = shoot(withObject({ ...spree, objects: [], ammo: MAGAZINE }, PROTECTED), 50, 50)
ok(spree.phase === 'over' && spree.ending === 'trouble', 'shooting people-things repeatedly ends the round')

section('Friendlier: it reloads by itself')
let last = { ...g, ammo: 1 }
let empty = shoot(withObject(last, KILLABLE), 50, 50)
ok(empty.ammo === 0, 'the last shot empties the magazine')
ok(empty.reloadingUntil > 0, 'and a reload starts on its own — you cannot get stuck')
let refilled = step(empty, RELOAD_MS + 20, seeded(2))
ok(refilled.ammo === MAGAZINE, 'the magazine refills by itself')
ok(shoot(empty, 50, 50).shots === empty.shots, 'you cannot fire mid-reload')
ok(reload({ ...g, ammo: 4 }).reloadingUntil > 0, 'R still reloads early')
ok(MAGAZINE === 10, 'ten shots per magazine')

section('Hit detection')
ok(shoot(withObject(g, KILLABLE), 52, 51).hits === 1, 'a shot inside the sprite hits')
ok(shoot(withObject(g, KILLABLE), 78, 50).misses === 1, 'a shot far away misses')
const stacked = { ...g, objects: [
  { uid: 1, def: normalize([KILLABLE])[0], mode: 'side', dir: 1, x: 50, y: 50, vy: 0, drift: 0, born: 0 },
  { uid: 2, def: normalize([PROTECTED])[0], mode: 'side', dir: 1, x: 50, y: 50, vy: 0, drift: 0, born: 0 },
] }
ok(shoot(stacked, 50, 50).stats.bad === 1, 'overlapping sprites: the top one is hit')

section('Streak bonus')
let cg = g
for (let i = 0; i < 3; i++) cg = shoot(withObject({ ...cg, objects: [], ammo: MAGAZINE }, KILLABLE), 50, 50)
ok(cg.combo === 3 && cg.bestCombo === 3, 'three in a row builds a streak')
ok(cg.events.at(-1).delta > KILLABLE.points, 'the third in a row pays a bonus')

section('The intro appears before the first round')
ok(showIntro(createGame()).phase === 'intro', 'the game can enter an intro phase')
ok(startGame(createGame()).phase === 'playing', 'and starting skips straight to play')

section('Help still pauses rather than ending')
let paused = setPaused(g, true)
ok(paused.paused && paused.phase === 'playing', 'pausing keeps the game alive')
ok(step(paused, 1000, seeded(2)).t === paused.t, 'the clock freezes while paused')
ok(shoot(paused, 50, 50).shots === paused.shots, 'you cannot fire while paused')

section('Full one-minute playthroughs')
function play(strategy, seed = 4) {
  let s = startGame(createGame())
  const r = seeded(seed)
  let guard = 0
  while (s.phase === 'playing' && guard++ < 6000) {
    s = strategy(s, r)
    s = step(s, 100, r)
  }
  return s
}
const careful = (s) => {
  if (s.ammo === 0) return s
  const t = s.objects.find((o) => o.def.killable && o.x > 4 && o.x < 96 && o.y < 100)
  return t ? shoot(s, t.x, t.y) : s
}
const cr = play(careful)
ok(cr.ending === 'timeup', `careful play lasts the full minute (${cr.ending})`)
ok(cr.stats.bad === 0, 'and shoots nothing that needed a person')
ok(cr.score > 100, `and scores well (${cr.score})`)

const wild = (s) => {
  if (s.ammo === 0) return s
  const t = s.objects.find((o) => o.x > 4 && o.x < 96)
  return t ? shoot(s, t.x, t.y) : s
}
const wr = play(wild)
ok(wr.ending === 'trouble', `shooting everything ends in trouble (${wr.ending})`)
ok(wr.t < ROUND_MS, `and ends early (${(wr.t / 1000).toFixed(0)}s of 60)`)
ok(wr.score < cr.score, `and scores far worse (${wr.score} vs ${cr.score})`)

const idle = play((s) => s)
ok(idle.ending === 'timeup', 'sitting still survives the clock')
ok(idle.score < 0, `but scores negatively (${idle.score}) — sitting still is not a winning move`)
ok(getVerdict(idle).grade === 'D', 'and earns a D')

section('Verdicts, in plain words')
const V = (o) => getVerdict({ shots: 20, hits: 10, misses: 2, stats: { good: 0, bad: 0, escaped: 0, spared: 0, byId: {} }, ...o })
ok(V({ stats: { good: 3, bad: 5, escaped: 0, spared: 0, byId: {} } }).grade === 'A+', 'shooting people-things gets the top grade (the joke)')
ok(V({ stats: { good: 1, bad: 0, escaped: 10, spared: 0, byId: {} } }).grade === 'D', 'shooting nothing gets a D')
ok(V({ stats: { good: 14, bad: 0, escaped: 2, spared: 5, byId: {} } }).grade === 'C−', 'playing well is punished with a C-minus')
ok(V({ shots: 20, hits: 4, misses: 14, stats: { good: 4, bad: 0, escaped: 2, spared: 3, byId: {} } }).grade === 'B−', 'poor aim gets a B-minus')
ok(V({ stats: { good: 7, bad: 1, escaped: 3, spared: 6, byId: {} } }).grade === 'B+', 'balanced play is "sensible"')
ok(getVerdict(cr).grade === 'C−', 'the real careful playthrough gets the C-minus punchline')

section('Plain English check')
const BANNED = ['collateral', 'drudgery', 'compute', 'accountability', 'accountable', 'leverage', 'mechanical']
const copy = [
  ...Object.values(ENDINGS).flatMap((e) => [e.title, e.line]),
  ...TARGETS.map((t) => t.label),
  ...TARGETS.filter((t) => t.hit).map((t) => t.hit),
].join(' ').toLowerCase()
BANNED.forEach((w) => ok(!copy.includes(w), `no jargon: "${w}" is gone from labels and endings`))
ok(TARGETS.every((t) => t.label.split(' ').length <= 5), 'every label is five words or fewer')

// ===========================================================================
section('SECRET LAYER: firing too fast turns the game around')

// fires n shots at the same instant, the way a rage-clicker does
function burst(state, n, gapMs = 60) {
  let s = { ...state, t: Math.max(state.t, 4000) }
  for (let i = 0; i < n; i++) {
    if (s.phase !== 'playing') break
    s = { ...s, ammo: MAGAZINE, reloadingUntil: 0 }
    s = shoot(s, 50, 50)
    s = { ...s, t: s.t + gapMs }
  }
  return s
}

let calm = startGame(createGame())
ok(isRaging([], 0) === false, 'no shots is not raging')
ok(isRaging(Array.from({ length: RAGE_SHOTS }, (_, i) => 4000 + i * 50), 4300) === true,
  `${RAGE_SHOTS} shots inside the window counts as raging`)
ok(isRaging(Array.from({ length: RAGE_SHOTS }, (_, i) => 4000 + i * 500), 7000) === false,
  'the same shots spread out do not count')
ok(isRaging(Array.from({ length: RAGE_SHOTS + 3 }, (_, i) => i * 40), 500) === false,
  'and it never fires in the opening seconds, before anyone has seen the game')

let raged = burst(calm, RAGE_SHOTS + 1, 60)
ok(raged.phase === 'flipping', 'a fast burst flips the game into the glitch screen')
ok(raged.flips === 1, 'the flip is counted')
ok(raged.objects.length === 0, 'the normal targets are cleared away')

let steady = calm
for (let i = 0; i < RAGE_SHOTS + 4; i++) {
  steady = { ...steady, ammo: MAGAZINE, reloadingUntil: 0 }
  steady = shoot(steady, 50, 50)
  steady = { ...steady, t: steady.t + 400 }   // slow, aimed shooting
}
ok(steady.phase === 'playing', 'shooting at a normal pace never triggers it')
ok(steady.flips === 0, 'and never counts a flip')

section('SECRET LAYER: you cannot trigger it by accident elsewhere')
ok(shoot({ ...calm, phase: 'over' }, 50, 50).phase === 'over', 'shooting after the game ends does nothing')
ok(burst(setPaused(calm, true), RAGE_SHOTS + 2).phase === 'playing', 'shots while paused do not count')

section('SECRET LAYER: the dodge game')
let hunted = enterHunt(raged)
ok(hunted.phase === 'hunted', 'the glitch screen hands over to the dodge game')
ok(hunted.hunt !== null, 'a dodge game is created')
ok(hunted.hunt.lives === LIVES, `you start with ${LIVES} lives`)
ok(enterHunt(calm).phase === 'playing', 'it cannot be entered from the normal game directly')

const h0 = createHunt()
ok(h0.outcome === null, 'the dodge game starts unresolved')
ok(h0.duration === HUNT_MS, `you must survive ${HUNT_MS / 1000}s`)
ok(HUNTER_LABELS.length >= 6, 'the crosshairs carry a few different labels')

// crosshairs appear
let h = h0
for (let i = 0; i < 10; i++) h = stepHunt(h, 100, { x: 50, y: 60 }, seeded(5))
ok(h.lockers.length > 0, 'crosshairs lock on to you')
ok(h.lockers.every((l) => l.label), 'each one is labelled')

section('SECRET LAYER: attacks are telegraphed and dodgeable')
ok(hitsPlayer(50, 60, { x: 50, y: 60 }) === true, 'a blast on top of you hits')
ok(hitsPlayer(50, 60, { x: 90, y: 60 }) === false, 'a blast far away misses')
const edge = BLAST_R + PLAYER_R
ok(hitsPlayer(50, 60, { x: 50 + edge - 0.5, y: 60 }) === true, 'just inside the blast edge hits')
ok(hitsPlayer(50, 60, { x: 50 + edge + 1.5, y: 60 }) === false, 'just outside the blast edge misses')
ok(lockTime(0) > lockTime(15000), 'crosshairs lock on faster as it goes')
ok(waveSize(0) < waveSize(15000), 'and more of them appear later')

// A player who keeps moving should get through it.
function playHunt(mover, seed = 3) {
  let s = createHunt()
  const r = seeded(seed)
  let n = 0
  while (!s.outcome && n < 900) {
    s = stepHunt(s, 60, mover(s, n), r)
    n++
  }
  return s
}
const runner = playHunt((s, n) => ({ x: 50 + Math.sin(n / 9) * 40, y: 50 + Math.cos(n / 7) * 32 }))
ok(runner.outcome === 'survived', `keeping moving gets you out alive (${runner.hitsTaken} hits taken)`)
ok(runner.dodged > 8, `and you dodge plenty on the way (${runner.dodged})`)

const statue = playHunt(() => ({ x: 50, y: 60 }))
ok(statue.outcome === 'caught', 'standing perfectly still gets you caught')
ok(statue.t < HUNT_MS, `and it happens before the time is up (${(statue.t / 1000).toFixed(1)}s)`)

// Barely shuffling about is nearly as bad as standing still.
const shuffler = playHunt((s, n) => ({ x: 50 + Math.sin(n / 40) * 8, y: 58 + Math.cos(n / 45) * 5 }), 12)
ok(shuffler.outcome === 'caught', 'barely moving still gets you caught')

// A player who actually reacts to what is on screen gets out comfortably.
// This is the realistic case: it steers away from the nearest crosshair.
function reactiveDodger(speed) {
  let at = { x: 50, y: 60 }
  return (s) => {
    let ax = (50 - at.x) * 0.02
    let ay = (58 - at.y) * 0.02
    for (const l of s.lockers) {
      const dx = at.x - l.x
      const dy = (at.y - l.y) / Y_SCALE
      const d = Math.hypot(dx, dy) || 1
      if (d < 26) { ax += (dx / d / d) * 40; ay += (dy / d / d) * 40 }
    }
    const m = Math.hypot(ax, ay) || 1
    const stepSize = speed * 0.06
    at = {
      x: Math.max(5, Math.min(95, at.x + (ax / m) * stepSize)),
      y: Math.max(8, Math.min(92, at.y + (ay / m) * stepSize * Y_SCALE)),
    }
    return at
  }
}
const reactive = [1, 2, 3, 4, 5, 6].map((sd) => playHunt(reactiveDodger(40), sd))
const lived = reactive.filter((r) => r.outcome === 'survived').length
ok(lived >= 5, `a player who actually dodges gets out almost every time (${lived}/6)`)
ok(reactive.filter((r) => r.outcome === 'survived').every((r) => r.hitsTaken <= 2),
  'and the ones who get out rarely lose more than a life or two')

section('SECRET LAYER: getting out, and not getting out')
let won = { ...hunted, hunt: { ...hunted.hunt, outcome: 'survived' } }
let back = leaveHunt(won)
ok(back.phase === 'playing', 'surviving puts you back in the normal game')
ok(back.score === hunted.score + SURVIVE_BONUS, `and pays a bonus of ${SURVIVE_BONUS}`)
ok(back.survived === 1, 'the escape is counted')
ok(back.hunt === null, 'the dodge game is cleared away')
ok(back.ammo === MAGAZINE, 'and you come back with a full magazine')
ok(back.shotTimes.length === 0, 'the burst counter resets so it cannot instantly retrigger')

let lost = leaveHunt({ ...hunted, hunt: { ...hunted.hunt, outcome: 'caught' } })
ok(lost.phase === 'over', 'getting caught ends the run')
ok(lost.ending === 'automated', 'with its own ending')
ok(ENDINGS.automated.title.includes('AUTOMATED'), 'and its own title')

section('SECRET LAYER: the secret grades')
ok(getVerdict({ ...lost, stats: { good: 5, bad: 0, escaped: 1, spared: 2, byId: {} }, shots: 20, hits: 5, misses: 10 }).grade === 'F',
  'getting caught scores an F, whatever else you did')
ok(getVerdict({ ...back, ending: 'timeup', stats: { good: 5, bad: 0, escaped: 1, spared: 2, byId: {} }, shots: 20, hits: 5, misses: 2 }).grade === 'S',
  'getting away scores a secret S')
ok(getVerdict({ ending: 'timeup', survived: 0, shots: 20, hits: 10, misses: 2, stats: { good: 7, bad: 1, escaped: 3, spared: 6, byId: {} } }).grade === 'B+',
  'a normal game is unaffected by any of this')

section('SECRET LAYER: a whole run, discovered by rage-clicking')
let run = startGame(createGame())
run = burst(run, RAGE_SHOTS + 2, 55)
ok(run.phase === 'flipping', 'rage-clicking flips it')
run = enterHunt(run)
let frame = 0
while (!run.hunt.outcome && frame < 900) {
  run = { ...run, hunt: stepHunt(run.hunt, 60, { x: 50 + Math.sin(frame / 9) * 40, y: 50 + Math.cos(frame / 7) * 30 }, seeded(8)) }
  frame++
}
ok(run.hunt.outcome === 'survived', 'you can survive it')
run = leaveHunt(run)
ok(run.phase === 'playing', 'and carry on with the normal round')
let after = step(run, 100, seeded(2))
ok(after.phase === 'playing' && after.t > run.t, 'the normal clock runs again afterwards')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
