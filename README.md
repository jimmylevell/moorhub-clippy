# Clippy: Open Season

A small shooting game for the Copilot launch, in the style of Moorhuhn.

Boring work flies past. So do jobs that need a real person. Shoot the boring
work. Let the people go.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # ready-to-host files in dist/
npm test         # 134 checks, no browser needed
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

## There is a second easter egg

It is hidden inside the game, and this section spoils it. Stop reading if you
would rather find it.

<details>
<summary>Show me anyway</summary>

Stop aiming and just spray clicks — **seven shots in about a second and a half**
— and the game stops being a shooting game.

The screen glitches. A system notice says your output is unusually high, that
this role could be done faster, and that roles are being reassigned. Then it
flips: **you become the thing under the crosshair.**

You are the paperclip now. Crosshairs labelled "Efficiency review", "Your
replacement" and "Headcount planning" creep toward you and fire. You have three
lives and 16 seconds. Keep the mouse moving and they always fire a step behind
you. Stand still and they arrive.

- **Get away** → back to the normal round, +120 points, and the end screen
  gives you a secret **S** grade: *"Saw the other side and came back."*
- **Get caught** → the run ends with **YOU HAVE BEEN AUTOMATED** and an **F**:
  *"You fired so fast that you stopped looking at what you were firing at. Then
  the crosshair turned around."*

It cannot fire in the first three seconds of a round, so nobody trips it before
they have seen the normal game. Shooting at a sensible pace never triggers it.

The whole thing lives in `src/hunted.js`. Numbers worth touching: `HUNT_MS` (how
long you must survive), `LIVES`, `TRACK_SPEED` (how fast a crosshair creeps
toward you) and `MIN_OFF` (how far away one can appear — keep it above
`BLAST_R + PLAYER_R` or they can land right on top of you). The trigger itself
is `RAGE_SHOTS` and `RAGE_WINDOW` in `src/game.js`.

</details>

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
| `src/hunted.js` | the hidden second game |
| `test-game.mjs` | 134 checks, including full simulated playthroughs of both games |

`src/game.js` is plain functions, so the whole game can be played in Node with
no browser. The tests play three full rounds — careful, wild and doing nothing —
and check each one ends the way it should.
