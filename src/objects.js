// ============================================================================
// THE TARGET LIST — this is the file you edit.
//
// Add a new thing in one line:
//   { id: 'my-thing', label: 'My thing', icon: '🧾', killable: true, points: 10 }
//
// Fields:
//   id        unique name
//   label     text shown under the icon. Keep it short (max 30 letters).
//   icon      any emoji
//   killable  true  = SHOOT IT. Boring work a machine can do.
//             false = LET IT GO. A person is needed. These glow yellow in game.
//   points    what you win for a correct shot
//
// All optional, with defaults:
//   penalty   what you lose for shooting a person-thing   (default 20)
//   escape    what you lose if work flies past unshot     (default 3)
//   weight    how often it shows up                       (default 1)
//   speed     how fast it moves                           (default 15)
//   size      how big it is                               (default 9)
//   from      'side' | 'bottom' | 'both'                  (default 'both')
//   hit       funny line shown when you shoot it
// ============================================================================

export const DEFAULTS = {
  points: 10,
  penalty: 20,
  escape: 3,
  weight: 1,
  speed: 15,
  size: 9,
  from: 'both',
  hit: null,
}

export const TARGETS = [
  // ------------------------------------------------------- SHOOT THESE -----
  // Boring work. No thinking needed. Nobody's feelings involved.
  { id: 'status-report', label: 'Copy-paste report', icon: '📋', killable: true, points: 10 },
  { id: 'meeting-email', label: 'Meeting that was an email', icon: '📅', killable: true, points: 12 },
  { id: 'footnotes', label: '400 footnotes', icon: '🔤', killable: true, points: 10, speed: 11 },
  { id: 'translate', label: 'Translate the memo', icon: '🌐', killable: true, points: 10 },
  { id: 'receipts', label: 'Receipts to a table', icon: '🧾', killable: true, points: 12 },
  { id: 'rename', label: 'Rename 200 files', icon: '🗂️', killable: true, points: 8, speed: 19 },
  { id: 'csv-chart', label: 'Chart from a table', icon: '📊', killable: true, points: 10 },
  { id: 'boilerplate', label: 'Standard cover letter', icon: '📄', killable: true, points: 8 },
  { id: 'typo', label: 'Find the typo', icon: '🔍', killable: true, points: 14, speed: 24, size: 7 },
  { id: 'messy-notes', label: 'Tidy up messy notes', icon: '🧹', killable: true, points: 10 },
  { id: 'jira-hygiene', label: 'Tidy up the tickets', icon: '🎫', killable: true, points: 8, weight: 0.8 },
  { id: 'spam', label: 'Newsletter nobody reads', icon: '📨', killable: true, points: 10, from: 'bottom' },
  { id: 'jargon', label: 'The word "synergy"', icon: '💬', killable: true, points: 18, speed: 26, size: 7,
    weight: 0.6, from: 'bottom', hit: 'Gone from the language. Enjoy the quiet.' },
  { id: 'clippy-jr', label: 'Clippy Jr. (bonus)', icon: '📎', killable: true, points: 25, weight: 0.3,
    speed: 28, size: 7, from: 'bottom', hit: 'Bonus! Clippy has no notes.' },

  // ------------------------------------------------------- LET THESE GO ----
  // A real person is needed. These glow yellow.
  { id: 'review', label: "Dave's review", icon: '🧑‍💼', killable: false, penalty: 25,
    hit: 'A paperclip just decided a career. Dave will never know why.' },
  { id: 'legal', label: 'Legal sign-off', icon: '⚖️', killable: false, penalty: 30,
    hit: 'Signed by nobody. Binding on everybody.' },
  { id: 'medical', label: 'A health question', icon: '🩺', killable: false, penalty: 35,
    hit: 'You gave a medical opinion. With no body.' },
  { id: 'apology', label: 'Saying sorry', icon: '🤝', killable: false, penalty: 25,
    hit: 'Sorry, at scale. They could tell.' },
  { id: 'intern', label: 'An intern learning', icon: '🧠', killable: false, penalty: 30, speed: 12,
    hit: 'You took away the part where they got good at it.' },
  { id: 'mentoring', label: 'Teaching a junior', icon: '👩‍🏫', killable: false, penalty: 25 },
  { id: 'promotion', label: 'Who gets promoted', icon: '🗳️', killable: false, penalty: 30 },
  { id: 'fire-safety', label: 'Fire safety rules', icon: '🧯', killable: false, penalty: 35,
    hit: 'Made up. Not checked. Pinned by the exit.' },
  { id: 'bad-news', label: 'Bad news, in person', icon: '💔', killable: false, penalty: 35, speed: 12 },
  { id: 'judgment', label: 'Your own judgment', icon: '🎓', killable: false, penalty: 40, weight: 0.5,
    speed: 10, from: 'bottom', hit: 'Gone. You will not notice for eight months.' },
  { id: 'looks-right', label: 'Answer that looks right', icon: '✅', killable: false, penalty: 30,
    weight: 0.9, speed: 18, hit: 'It was wrong. It looked so tidy that nobody checked.' },
  { id: 'citation', label: 'A source nobody checked', icon: '📚', killable: false, penalty: 30,
    weight: 0.8, speed: 20, hit: 'That book does not exist.' },
  { id: 'duck', label: 'The rubber duck', icon: '🦆', killable: false, penalty: 15, weight: 0.35,
    speed: 9, from: 'bottom', hit: 'You shot the duck. The duck was helping.' },
  { id: 'afternoon', label: 'A free afternoon', icon: '🌤️', killable: false, penalty: 30, weight: 0.3,
    speed: 13, from: 'bottom', hit: 'You automated your own free time. Straight back to work.' },
]

export function normalize(list = TARGETS) {
  return list.map((t) => ({ ...DEFAULTS, ...t }))
}

// Runs at startup so a typo fails loudly instead of quietly.
export function validate(list = TARGETS) {
  const errors = []
  const seen = new Set()
  const FROM = ['side', 'bottom', 'both']

  list.forEach((t, i) => {
    const at = `targets[${i}] (${t.id ?? 'no id'})`
    if (!t.id) errors.push(`${at}: missing id`)
    else if (seen.has(t.id)) errors.push(`${at}: duplicate id "${t.id}"`)
    else seen.add(t.id)

    if (!t.label) errors.push(`${at}: missing label`)
    if (!t.icon) errors.push(`${at}: missing icon`)
    if (typeof t.killable !== 'boolean') errors.push(`${at}: killable must be true or false`)
    if (t.killable && !(t.points > 0)) errors.push(`${at}: things you shoot need points above 0`)
    if (t.weight !== undefined && !(t.weight > 0)) errors.push(`${at}: weight must be above 0`)
    if (t.speed !== undefined && !(t.speed > 0)) errors.push(`${at}: speed must be above 0`)
    if (t.size !== undefined && !(t.size > 0)) errors.push(`${at}: size must be above 0`)
    if (t.from !== undefined && !FROM.includes(t.from)) errors.push(`${at}: from must be side, bottom or both`)
    if (t.label && t.label.length > 30) errors.push(`${at}: label too long to fit (${t.label.length} letters)`)
  })

  return errors
}

export function pickTarget(list, rnd = Math.random) {
  const total = list.reduce((sum, t) => sum + t.weight, 0)
  let roll = rnd() * total
  for (const t of list) {
    roll -= t.weight
    if (roll <= 0) return t
  }
  return list[list.length - 1]
}
