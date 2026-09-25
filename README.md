# Clippy: Open Season

A small shooting game for the Copilot launch, in the style of Moorhuhn.

Boring work flies past. So do jobs that need a real person. Shoot the boring
work. Let the people go.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # ready-to-host files in dist/
npm test         # 84 checks, no browser needed
```

Everything comes from npm. Nothing is loaded from the internet at runtime.

---

## How to play

**Click** to shoot · **R** to reload early · **H** for help · **Esc** to close

**One rule: if it glows yellow, a real person is needed. Let it go.**

| | What | Points |
|---|---|---|
| 🎯 | Reports, renaming files, tidying tables, translating a memo | **+8 to +25** |
| 🚫 | A review, legal, an intern learning — these glow yellow | **−15 to −40** |

- You get **10 shots**. It reloads by itself, so you cannot get stuck.
- Every hit shows a floating **+10** or **−30**, so you always see what a shot cost.
- Things fly in **from the sides** and pop **up from the bottom**.
- Hit three in a row for a bonus.
- Work that flies past costs a few points, so sitting still is not a winning move.
- **Trouble** goes up when you shoot something that needed a person. Fill it and
  the game ends early.
- A round is one minute.

New players get a short three-card intro the first time. After that it goes
straight into the game. "How to play" on the menu brings it back.

---

## Adding your own things

**`src/objects.js` is the file you edit.** One line adds a new thing:

```js
{ id: 'expenses', label: 'Expense report', icon: '🧾', killable: true, points: 10 },
```

| Field | Needed | Default | What it does |
|---|---|---|---|
| `id` | yes | — | unique name |
| `label` | yes | — | text under the icon, max 30 letters |
| `icon` | yes | — | any emoji |
| `killable` | yes | — | `true` = shoot it · `false` = let it go (it will glow) |
| `points` | if killable | — | what a correct shot is worth |
| `penalty` | no | `20` | what you lose for shooting a glowing one |
| `escape` | no | `3` | what you lose if work flies past |
| `weight` | no | `1` | how often it shows up |
| `speed` | no | `15` | how fast it moves |
| `size` | no | `9` | how big it is |
| `from` | no | `'both'` | `'side'`, `'bottom'` or `'both'` |
| `hit` | no | — | funny line shown when you shoot it |

The list is checked when the game starts. A missing field, a repeated `id` or a
label that is too long stops the game straight away and tells you which line is
wrong. It will not quietly ship something broken.

Swap in your own team's work. Just keep the split honest — if everything can be
shot, the joke stops working.

---

## The joke

At the end you get a grade based on how you played.

Shoot four or more glowing things and you get **A+ — "Promoted to Head of AI."**
Play it properly, shooting only the boring work, and you get
**C− — "Not using AI enough, apparently."**

---

## Files

| File | What is in it |
|---|---|
| `src/objects.js` | **the list of things — edit this one** |
| `src/game.js` | all the game rules |
| `src/components/Arena.jsx` | the playing field, crosshair and flying things |
| `src/components/Intro.jsx` | the three intro cards |
| `test-game.mjs` | 84 checks, including three full one-minute games |

`src/game.js` is plain functions, so the whole game can be played in Node with
no browser. The tests play three full rounds — careful, wild and doing nothing —
and check each one ends the way it should.
