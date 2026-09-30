// ============================================================================
// THE SECOND EASTER EGG
//
// Shoot fast enough and the game flips: you stop being the one holding the
// crosshair and become the thing under it. Survive, and you go back to work.
//
// The attacks are telegraphed. A crosshair locks onto where you are, waits,
// then fires. Keep moving and nothing can touch you. Stand still and you are
// exactly as easy to automate as everything else on screen.
// ============================================================================

export const HUNT_MS = 16000      // how long you must survive
export const LIVES = 3
export const LOCK_MIN = 780       // fastest lock-on, late in the round
export const LOCK_MAX = 1250      // slowest lock-on, at the start
export const BLAST_MS = 360
export const INVULN_MS = 1600
export const BLAST_R = 7        // blast size, % of arena width
export const PLAYER_R = 3.2       // your hitbox, % of arena width
export const MIN_OFF = 14         // always further than its own blast reach (8.5+4.2)
export const MAX_OFF = 34
export const TRACK_SPEED = 12      // it creeps, it does not chase. %/s

// The arena is 16:9, so the same distance is worth more percent vertically.
export const Y_SCALE = 16 / 9

export const HUNTER_LABELS = [
  'Efficiency review',
  'Headcount planning',
  'Cost centre audit',
  'Your replacement',
  'Q3 restructure',
  'Productivity metrics',
  'Role consolidation',
  'Synergy assessment',
]

let uid = 0

export function createHunt() {
  return {
    t: 0,
    duration: HUNT_MS,
    player: { x: 50, y: 60 },
    lockers: [],
    blasts: [],
    nextSpawnAt: 500,
    lives: LIVES,
    invulnUntil: 0,
    dodged: 0,
    hitsTaken: 0,
    outcome: null, // null | 'survived' | 'caught'
  }
}

export function spawnDelay(t) {
  return Math.max(520, 1000 - t * 0.024)
}

export function lockTime(t) {
  return Math.max(LOCK_MIN, LOCK_MAX - t * 0.026)
}

// How many crosshairs appear at once, so it builds instead of starting brutal.
export function waveSize(t) {
  return t > 12000 ? 2 : 1
}

export function hitsPlayer(blastX, blastY, player) {
  const dx = blastX - player.x
  const dy = (blastY - player.y) / Y_SCALE
  const reach = BLAST_R + PLAYER_R
  return dx * dx + dy * dy <= reach * reach
}

function spawnLocker(h, rnd) {
  // The crosshair lands NEAR you, never exactly on you: a random direction,
  // at least MIN_OFF away. So moving away from it always works, and the
  // danger is standing still while one drifts onto your spot.
  const angle = rnd() * Math.PI * 2
  const dist = MIN_OFF + rnd() * (MAX_OFF - MIN_OFF)
  const x = clamp(h.player.x + Math.cos(angle) * dist, 8, 92)
  const y = clamp(h.player.y + Math.sin(angle) * dist * Y_SCALE, 12, 88)
  return {
    uid: ++uid,
    x,
    y,
    born: h.t,
    lockMs: lockTime(h.t),
    label: HUNTER_LABELS[Math.floor(rnd() * HUNTER_LABELS.length)],
    fired: false,
  }
}

const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n))

// `mouse` is where the pointer is; the player drifts toward it so there is a
// little weight to the movement.
export function stepHunt(h, dt, mouse, rnd = Math.random) {
  if (h.outcome) return h

  const t = h.t + dt
  const secs = dt / 1000

  const ease = Math.min(1, secs * 14)
  const player = {
    x: clamp(h.player.x + (mouse.x - h.player.x) * ease, 2, 98),
    y: clamp(h.player.y + (mouse.y - h.player.y) * ease, 2, 98),
  }

  let lives = h.lives
  let invulnUntil = h.invulnUntil
  let dodged = h.dodged
  let hitsTaken = h.hitsTaken
  let blasts = h.blasts.filter((b) => t - b.born < BLAST_MS)
  const lockers = []

  for (const l of h.lockers) {
    // While it locks on, the crosshair creeps toward you. Stand still and it
    // arrives. Keep moving and it is always a step behind when it fires.
    const dx = player.x - l.x
    const dy = (player.y - l.y) / Y_SCALE
    const d = Math.hypot(dx, dy) || 1
    const move = Math.min(d, TRACK_SPEED * secs)
    const crept = { ...l, x: l.x + (dx / d) * move, y: l.y + (dy / d) * move * Y_SCALE }

    if (t - l.born < l.lockMs) {
      lockers.push(crept)
      continue
    }
    // It fires wherever it had crept to, which is behind you if you moved.
    const caught = hitsPlayer(crept.x, crept.y, player)
    blasts = [...blasts, { uid: ++uid, x: crept.x, y: crept.y, born: t, caught }]
    if (caught && t >= invulnUntil) {
      lives -= 1
      hitsTaken += 1
      invulnUntil = t + INVULN_MS
    } else if (!caught) {
      dodged += 1
    }
  }

  let nextSpawnAt = h.nextSpawnAt
  let spawned = lockers
  if (t >= nextSpawnAt) {
    const next = { ...h, t, player }
    for (let i = 0; i < waveSize(t); i++) spawned = [...spawned, spawnLocker(next, rnd)]
    nextSpawnAt = t + spawnDelay(t)
  }

  const out = {
    ...h,
    t,
    player,
    lockers: spawned,
    blasts,
    nextSpawnAt,
    lives,
    invulnUntil,
    dodged,
    hitsTaken,
  }

  if (lives <= 0) return { ...out, outcome: 'caught' }
  if (t >= h.duration) return { ...out, outcome: 'survived' }
  return out
}
