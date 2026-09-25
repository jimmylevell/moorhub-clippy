import { TARGETS, normalize, pickTarget, validate } from './objects.js'

export const ROUND_MS = 60000
export const MAGAZINE = 10       // shots before a reload
export const RELOAD_MS = 800
export const TROUBLE_MAX = 100   // shoot too many people-things and the game ends
export const MISS_COST = 1
export const GRAVITY = 115       // for things that pop up from the bottom
export const POPUP_MS = 850      // how long a floating +10 stays on screen

export function spawnDelay(t) {
  return Math.max(340, 1050 - t * 0.011)
}

let uid = 0

export function createGame(targets = TARGETS) {
  const errors = validate(targets)
  if (errors.length) throw new Error('Bad target list:\n' + errors.join('\n'))

  return {
    phase: 'menu',          // menu | intro | playing | over
    defs: normalize(targets),
    t: 0,
    duration: ROUND_MS,
    objects: [],
    popups: [],
    nextSpawnAt: 250,
    score: 0,
    ammo: MAGAZINE,
    reloadingUntil: 0,
    trouble: 0,
    combo: 0,
    bestCombo: 0,
    shots: 0,
    hits: 0,
    misses: 0,
    events: [],
    paused: false,
    ending: null,
    stats: { good: 0, bad: 0, escaped: 0, spared: 0, byId: {} },
  }
}

export function startGame(state) {
  return { ...createGame(), defs: state.defs, phase: 'playing' }
}

export function showIntro(state) {
  return { ...state, phase: 'intro' }
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

function bump(byId, id, field) {
  const row = byId[id] || { good: 0, bad: 0, escaped: 0 }
  return { ...byId, [id]: { ...row, [field]: row[field] + 1 } }
}

function addEvent(events, ev) {
  return [...events, { ...ev, id: ++uid }].slice(-3)
}

function addPopup(popups, t, x, y, text, kind) {
  return [...popups, { id: ++uid, x, y, text, kind, born: t }].slice(-8)
}

const LANE_GAP = 13

function spawn(state, rnd) {
  const def = pickTarget(state.defs, rnd)

  // Decide whether it flies in from the side or pops up from the bottom.
  const mode =
    def.from === 'side' ? 'side'
    : def.from === 'bottom' ? 'pop'
    : rnd() < 0.38 ? 'pop' : 'side'

  if (mode === 'pop') {
    const rise = 42 + rnd() * 38
    return {
      uid: ++uid,
      def,
      mode: 'pop',
      dir: rnd() < 0.5 ? 1 : -1,
      x: 12 + rnd() * 76,
      y: 106,
      vy: -Math.sqrt(2 * GRAVITY * rise),
      drift: (rnd() - 0.5) * 12,
      born: state.t,
    }
  }

  const dir = rnd() < 0.5 ? 1 : -1
  // Keep labels off each other: compare against every side-flyer, not just
  // the ones near the edge, so mid-arena labels do not collide either.
  const others = state.objects.filter((o) => o.mode === 'side')
  let y = 12 + rnd() * 58
  for (let i = 0; i < 8; i++) {
    const cand = 12 + rnd() * 58
    y = cand
    if (!others.some((o) => Math.abs(o.y - cand) < LANE_GAP)) break
  }

  return {
    uid: ++uid,
    def,
    mode: 'side',
    dir,
    x: dir === 1 ? -def.size - 6 : 100 + def.size + 6,
    y,
    vy: 0,
    drift: 0,
    born: state.t,
  }
}

export function checkEnd(s) {
  if (s.trouble >= TROUBLE_MAX) return 'trouble'
  if (s.t >= s.duration) return 'timeup'
  return null
}

export function step(state, dt, rnd = Math.random) {
  if (state.phase !== 'playing' || state.paused) return state

  const t = state.t + dt
  const secs = dt / 1000
  let { score, combo } = state
  let stats = state.stats
  let events = state.events
  const kept = []

  for (const o of state.objects) {
    let { x, y, vy } = o

    if (o.mode === 'pop') {
      vy = o.vy + GRAVITY * secs
      y = o.y + vy * secs
      x = o.x + o.drift * secs
    } else {
      x = o.x + o.dir * o.def.speed * secs
    }

    const gone =
      o.mode === 'pop'
        ? y > 112
        : (o.dir === -1 && x < -o.def.size - 10) || (o.dir === 1 && x > 100 + o.def.size + 10)

    if (gone) {
      if (o.def.killable) {
        score -= o.def.escape
        combo = 0
        stats = { ...stats, escaped: stats.escaped + 1, byId: bump(stats.byId, o.def.id, 'escaped') }
        events = addEvent(events, {
          kind: 'escape',
          label: o.def.label,
          text: 'Got away. You will do that one by hand.',
          delta: -o.def.escape,
        })
      } else {
        stats = { ...stats, spared: stats.spared + 1 }
      }
      continue
    }
    kept.push({ ...o, x, y, vy })
  }

  let objects = kept
  let nextSpawnAt = state.nextSpawnAt
  if (t >= nextSpawnAt) {
    objects = [...objects, spawn({ ...state, t, objects }, rnd)]
    nextSpawnAt = t + spawnDelay(t)
  }

  let ammo = state.ammo
  let reloadingUntil = state.reloadingUntil
  if (reloadingUntil && t >= reloadingUntil) {
    ammo = MAGAZINE
    reloadingUntil = 0
  }

  const popups = state.popups.filter((p) => t - p.born < POPUP_MS)

  const next = { ...state, t, objects, popups, nextSpawnAt, score, combo, ammo, reloadingUntil, stats, events }
  const ending = checkEnd(next)
  return ending ? { ...next, phase: 'over', ending } : next
}

export function isReloading(s) {
  return s.reloadingUntil > 0
}

export function reload(state) {
  if (state.phase !== 'playing' || isReloading(state) || state.ammo === MAGAZINE) return state
  return { ...state, reloadingUntil: state.t + RELOAD_MS, ammo: 0 }
}

function findHit(objects, x, y) {
  for (let i = objects.length - 1; i >= 0; i--) {
    const o = objects[i]
    const rx = o.def.size * 0.68
    const ry = o.def.size * 0.78
    const dx = (x - o.x) / rx
    const dy = (y - o.y) / ry
    if (dx * dx + dy * dy <= 1) return o
  }
  return null
}

// Starts a reload by itself when the magazine runs dry, so nobody gets stuck.
function autoReload(s) {
  return s.ammo === 0 && !s.reloadingUntil ? { ...s, reloadingUntil: s.t + RELOAD_MS } : s
}

export function shoot(state, x, y) {
  if (state.phase !== 'playing' || state.paused) return state
  if (isReloading(state) || state.ammo <= 0) return state

  const ammo = state.ammo - 1
  const target = findHit(state.objects, x, y)
  const base = { ...state, ammo, shots: state.shots + 1 }

  if (!target) {
    return autoReload({
      ...base,
      score: state.score - MISS_COST,
      misses: state.misses + 1,
      combo: 0,
      popups: addPopup(state.popups, state.t, x, y, 'miss', 'miss'),
    })
  }

  const objects = state.objects.filter((o) => o.uid !== target.uid)
  const def = target.def

  if (def.killable) {
    const combo = state.combo + 1
    const bonus = combo >= 3 ? Math.floor(def.points * 0.5) : 0
    const gain = def.points + bonus
    return autoReload({
      ...base,
      objects,
      score: state.score + gain,
      hits: state.hits + 1,
      combo,
      bestCombo: Math.max(state.bestCombo, combo),
      popups: addPopup(state.popups, state.t, target.x, target.y, `+${gain}`, 'good'),
      stats: { ...state.stats, good: state.stats.good + 1, byId: bump(state.stats.byId, def.id, 'good') },
      events: addEvent(state.events, {
        kind: 'good',
        label: def.label,
        text: def.hit || 'Done. Nobody misses it.',
        delta: gain,
        combo: combo >= 3 ? combo : 0,
      }),
    })
  }

  const hit = autoReload({
    ...base,
    objects,
    score: state.score - def.penalty,
    trouble: clamp(state.trouble + def.penalty, 0, TROUBLE_MAX),
    combo: 0,
    popups: addPopup(state.popups, state.t, target.x, target.y, `-${def.penalty}`, 'bad'),
    stats: { ...state.stats, bad: state.stats.bad + 1, byId: bump(state.stats.byId, def.id, 'bad') },
    events: addEvent(state.events, {
      kind: 'bad',
      label: def.label,
      text: def.hit || 'That one needed a person.',
      delta: -def.penalty,
    }),
  })
  const ending = checkEnd(hit)
  return ending ? { ...hit, phase: 'over', ending } : hit
}

export function setPaused(state, paused) {
  if (state.phase !== 'playing') return state
  return { ...state, paused }
}

export const ENDINGS = {
  timeup: {
    title: 'TIME UP',
    line: 'The hour is over. The work comes back tomorrow.',
  },
  trouble: {
    title: 'TOO MUCH TROUBLE',
    line: 'You let a paperclip do too many jobs that needed a person.',
  },
}

export function getVerdict(s) {
  const { good, bad, escaped } = s.stats

  if (bad >= 4) {
    return {
      grade: 'A+',
      title: 'Promoted to Head of AI',
      body: 'So fast. You let the paperclip handle reviews, legal and a junior’s whole learning curve. Nobody checked any of it. This is the best grade in the game, and that is the joke.',
    }
  }
  if (good <= 3 && escaped >= 8) {
    return {
      grade: 'D',
      title: 'Did it all by hand',
      body: 'You barely fired. Every file rename and every table went past you and into your own evening. The tool was right there.',
    }
  }
  if (good >= 12 && bad === 0) {
    return {
      grade: 'C−',
      title: 'Not using AI enough, apparently',
      body: 'You shot the boring work and left the people alone. Exactly right. It looks slow next to the person who let the paperclip do everything. You were still right.',
    }
  }
  if (s.misses > s.hits && s.shots > 8) {
    return {
      grade: 'B−',
      title: 'Lots of energy, poor aim',
      body: 'More shots missed than hit. Try looking before firing.',
    }
  }
  return {
    grade: 'B+',
    title: 'Sensible, which nobody rewards',
    body: `You shot ${good} bits of boring work, left the people alone, and let ${escaped} slip past. This is how you are meant to use the thing. Nobody will make a slide about it.`,
  }
}
