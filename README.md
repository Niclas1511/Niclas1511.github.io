# Niclas Niederdrenk

Source for my personal website, https://niederdrenk.de, hosted via GitHub Pages.

## Edit content

All page content lives in Markdown files:

- `pages/index.md`: profile, travels/conferences (Activities), and contact details.
- `pages/teaching.md`: teaching activities.
- `pages/runner.md`: Math Run, a canvas pixel runner with three obstacle heights.
  `runner-engine.js` handles physics and collisions; `runner.js` draws the scene
  and handles keyboard/touch controls. `runner.css` styles the page. Everything
  runs locally in the browser, including an optional best score in local storage.
  Hold Space/Up for a full jump, release for a short hop; two jumps are available
  before landing, with a 120 ms buffer when both have been used. Down ducks or accelerates descent.
  X throws chalk horizontally at the current height (three pieces; one recharges
  every four seconds). Successful volleys increase a multiplier without a cap; hit
  bonuses are five points times that multiplier. A completely missed volley resets
  the combo; spread shots settle together, in throw order. Every ten consecutive
  successful volleys grant one stored Hagoromo charge. The next throw consumes
  it instead of normal ammo, firing one giant labelled chalk even with spread active.
  It detonates on impact, at the ground/screen boundary, or after 0.9 seconds,
  clearing hazards and hostile projectiles within 180 pixels and dealing three
  boss damage. The blast cannot harm the player or collectibles. Each blast is
  still one volley for combo progress. Earned charges survive a later miss and
  arena transitions; restarting clears them. Algebra and
  PhD-themed motifs are defined in `MathRunner.motifs` in `runner-engine.js`.
  Six flying motifs add students with questions, urgent emails, Reviewer 2's pen,
  epsilon chased by delta, falling problem sheets, and conference invitations.
  Each flyer has an advance warning at the right edge. A chalk hit anywhere on a
  student answers their question, makes them harmless, and sends them away.
  Standing throws work; the speech bubble does not require a precision hit. Fixed obstacle speeds
  and scheduled arrival times prevent faster flyers from catching earlier hazards.
  Every fourth encounter, starting with the third, is a collectible instead of a
  a safe +10-point token at ground level or a higher heart/power-up with a trailing
  obstacle. Both rewards remain independently collectible; taking one leaves the other visible.
  Walk through an outlined icon: unlimited chalk lasts 10 seconds, triple
  throw lasts 10 seconds (one ammo per volley), and the animated shield lasts six
  seconds. The Student assistant (figure icon) stays until its five lives are spent and clears
  five hazards across all lanes, jumping into their path and recoiling with stars and an “Ouch!” on each hit.
  Each pickup hires an additional helper with five independent lives.
  Helpers run in formation and reserve different targets. They remain active in boss arenas and intercept enemy shots at one life per hit. Their hits do not increase the chalk combo.
  Homing chalk (H) lasts 10 seconds: normal projectiles arc toward visible hazards
  or the boss before accelerating into a bright pixel impact, retarget cleared hazards, and retain normal ammo and combo rules.
  It combines with triple throw and unlimited chalk; Hagoromo keeps its explosion.
  Different effects combine; repeat pickups refresh timers except for assistants, which add a teammate. Pause
  freezes the timers and restarting clears them. Items cannot be collected by shooting.
  A close dodge awards 10 points and restores up to one chalk. Worksheet hits fold
  the sheet into a harmless plane, pen hits produce red particles, and students
  acknowledge their answered question. Four 24-second phases change palettes and
  encounter patterns: Lecture week, Exam season, Conference, Deadline night.
  A faint, cached pixel-art background adds x²/ln(x) graphs, integration, circle
  geometry, Sierpiński/Koch fractals, and all five Platonic solids. It follows
  distance at a slow parallax rate, so it also stops during arenas and pauses.
  Office hours and Inbox overflow have two-second warnings and run for eight seconds.
  Every 60 seconds of running, after existing hazards clear, a boss starts an
  arena fight. Scrolling, distance score, normal spawns, and the semester clock stop.
  Arena controls are Left/Right to move, Space to jump, Down to duck/fast fall, and X to throw. A/D and
  Up remain optional aliases. Chalk flies horizontally in the last movement direction;
  jumping sets throw height. The boss moves for 0.85 seconds then holds a position
  for 2.35 seconds, creating jump-throw openings. Only Homing chalk steers at targets.
  No mouse or separate aiming keys are required. Touch uses the same action buttons.
  Space also starts or restarts the game when the canvas or page has keyboard focus.
  The boss moves and telegraphs
  aimed shots, fan shots, and ground waves; shield power-ups still protect the player.
  Chalk recharges every second in arenas. Six aimed hits win and award 100 extra
  points. There is no escape timeout: the runner resumes only after victory and
  the next boss follows another 60 seconds of running. Pause freezes both modes.
- `pages/memory.md`: Memory game; interaction and page-specific styles live in `memory.js` and `memory.css`.
  One mixed pool covers equations, roots, calculus, algebra, and combinatorics.
  KaTeX 0.19.0 loads from jsDelivr, with plain-text fallback. Matching requires
  a task and an answer with the same canonical value; duplicate answers are
  interchangeable. All answer keys in the curated pool use one spelling per value.

- `pages/legal.md`: legal notice and operator contact details, linked in the footer of every page.
- `pages/masters-thesis.md`: permanent thesis landing page at `/masters-thesis/`, with summary, bibliographic details, PDF download, and citation.
- `pages/notes.md`: notes and documents, with descriptions and links to PDFs in `documents/`.
- `pages/cv.md`: curriculum vitae. Use `##` for sections and
  `### Period: Position or degree` for individual entries, followed by the
  institution and optional bullet points. Entries appear in the order written;
  keep the most recent first within each section. Update the “Last updated” date
  when changing the CV.

`sources/cv-full.md` preserves the complete CV before the website was shortened.
It is a reference document and is not converted into a website page.

Use standard Markdown for headings, lists, links, emphasis, and tables. Optional
frontmatter at the start of each file sets the page title, subtitle, and language:

```md
---
title: Teaching
lang: en
---

## Summer Semester 2026

- Geometry
- [Course website](https://example.com)
```

Frontmatter uses plain `key: value` lines; quotes are unnecessary. The supported
keys are `title`, `subtitle`, and `lang`. Without frontmatter, the title defaults
to the filename and the language to English.

## Generate the website

Install Python 3 and the Markdown dependency once:

```sh
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

After editing Markdown, regenerate the HTML:

```sh
python3 build.py
```

The build discovers every `pages/*.md` file and writes its corresponding HTML
file at the repository root. For example, `pages/teaching.md` becomes
`teaching.html`. The permanent thesis page is the exception: `pages/masters-thesis.md`
becomes `masters-thesis/index.html`, served at `/masters-thesis/`. Add navigation entries to `NAV` in `build.py` for new pages.
Styling is defined in `style.css`. Typst is no longer required.

Commit the Markdown sources and generated HTML together, then push to publish
through the existing GitHub Pages setup. Do not edit generated HTML directly.
The build also downloads the current mathematical note to `documents/noposroots.pdf`.
Commit this PDF together with the generated pages so GitHub Pages can serve it.
When deleting a Markdown page, also delete its generated HTML and navigation
entry.

To preview locally, run `python3 -m http.server 8000` and open
http://localhost:8000.

Run the Memory logic checks with `gjs tests/memory.test.js` (requires GJS).
They cover duplicate answers, invalid pairs, completion, restart, and shuffled rounds.
Run the runner checks with `gjs tests/runner.test.js` and
`gjs tests/runner-ui.test.js`. These cover obstacle heights, collisions, spacing,
mobile reaction time, controls, pause/resume, and restart. The UI check uses a
mock canvas and DOM; it does not replace a visual browser check.
`gjs tests/runner-flyers.test.js` checks every flying type across screen widths,
speeds and frame rates, plus warnings, student interactions, and arrival spacing.
`gjs tests/runner-powerups.test.js` checks collection, effect expiry, combined
effects, spread-shot collisions, shields, ammo rules, and collectible scheduling.
`gjs tests/runner-progression.test.js` covers variable jumping and buffering,
combo settlement order, near-miss rewards, reactions, phase/event patterns, both
reward routes.
`gjs tests/runner-arena.test.js` checks recurring arenas, frozen runner clocks,
free movement, screen boundaries, automatic/spread throws in both directions, ammo,
attack dodge routes and victories at 30/60/120 FPS, and return to the runner.
`gjs tests/runner-hagoromo.test.js` checks ten-hit rewards, giant throws,
blast range, damage and safe targets, finite ammo, fuse/animation cleanup,
combo counting and arena-transition refunds.

## Preserve the thesis URL

Keep `https://niederdrenk.de/masters-thesis/` available when redesigning the site.
If the PDF moves, update its link in `pages/masters-thesis.md` and the
`citation_pdf_url` metadata in `build.py`. Preserve the old PDF path as well:
it may already have been cited directly.

Keep the landing page at its current path whenever possible. GitHub Pages does
not support custom HTTP 301 rules; if the page must move, configure a permanent
redirect at a hosting/proxy layer that supports HTTP redirects. Do not simply
delete `masters-thesis/index.html`. The canonical URL and citation examples should
continue to identify the permanent address.

Music: `assets/music/` contains complete public-domain Mutopia MIDI editions of
Mozart’s Rondo alla Turca and Bach’s Prelude in C major (BWV 846), plus a MIDI
conversion of a CC0 edition of Liszt’s Liebestraum No. 3, with provenance
in `assets/music/README.md`. `runner-music.js` reads the MIDI tempo map and plays
local files as square/triangle chiptune voices using Web Audio, without a soundfont
or runtime dependencies. Music defaults on and starts with the game, rotates Liszt → Mozart → Bach Prelude → Italian Concerto I → Italian Concerto II, and pauses on
game pause, game over, or loss of focus. M mutes/unmutes all music and effects; it never plays on the ready screen. Run `gjs tests/runner-music.test.js` for
MIDI parsing and mocked audio lifecycle checks.

`runner-sound.js` provides short, synthesized action effects independently of music.
Sound is enabled by default but its AudioContext opens only on Start or the Sound
button. Effects cover jumps, double jumps, landing, duck/fast fall, chalk variants,
hits and reactions, homing dives/impacts, Hagoromo explosions, pickups,
assistant jumps/recoil, Hagoromo milestone rewards, shields,
boss entry/attacks/hits/victory, and game over. Ordinary combo increments and
notification messages stay silent.
The Sound toggle mutes all effects; pause and focus loss cancel active voices and
pending gameplay cues. Identical cues are throttled and at most 20 voices play
at once. `gjs tests/runner-sound.test.js` checks audio scheduling and game events
using a mocked AudioContext; actual browser listening remains a manual check.

Boss arenas automatically switch enabled music to `assets/music/reviewer-2-boss.mid`,
an original 160 BPM D-minor battle cue with driving bass and rapid arpeggios.
After victory the selected classical track resumes from its previous position.
The boss theme obeys the same music toggle, pause, and focus-loss behavior.

Boss entry includes a 2.4-second in-canvas cinematic with letterboxing, moving
warning stripes, the boss title, an impact burst and sound. Combat, timers,
assistants, and player actions freeze until it ends. Pause/mute still work;
reduced-motion preferences disable slides, shaking, and moving particles.

Player health starts at one heart and caps at five. Every eighth runner
encounter offers a pixel heart on a clear ground route instead of a hazard.
Walk-through collection restores one life; chalk cannot collect hearts.
Obstacle or boss-shot damage costs one life and grants 1.5 seconds of blinking
recovery protection shared by all hazards. Shields preserve health. Lives carry
into/out of boss arenas; only zero hearts ends the game. Restart resets health.
`gjs tests/runner-hearts.test.js` checks health, collection, recovery, shields,
cinematic freezes and boss projectiles at 30/60/120 FPS.

Reviewer 2 → The Blackboard → The Printer → The Deadline rotate between boss encounters. Blackboard draws
for 1.2 seconds, then launches a bouncing parabola or low sine-wave projectile
and exposes its eraser for 3.6 seconds. The board panel stays armored; only the
eraser takes damage (8 HP, 3 damage from Hagoromo). Homing targets the exposed
eraser. Assistants can intercept graph projectiles. Boss name, health, intro and
renderer adapt to the encounter. `gjs tests/runner-blackboard.test.js` checks
armor, weak points, attack paths, power-ups, victories and single-life dodge routes.
The two Italian Concerto MIDIs are unmodified CC BY-SA 3.0 Mutopia files with
credits/license links in the game's help and `assets/music/README.md`.

Each new run starts with a uniformly random classical track from the MIDI collection, from the beginning. The boss theme is excluded from this selection. N or Next skips
to the next classical track without changing mute/pause settings. Boss themes
cannot be skipped. Pausing/resuming preserves the current track and position.

Boss arenas offer one elevated power-up after 18 combat seconds, then at random
intervals of 24–34 seconds. It appears on the side farther from the player, at
y=58–76, requiring a double jump, and expires after 6.5 seconds. It stays fixed
in the arena, obeys pause/cinematic freezes, and disappears on victory. All five
power-up types can appear; no extra notification tone is played.

Blackboard changes between y=100/156/72/128 during drawing, with smooth vertical
travel and stable exposed-eraser windows. Printer has a duckable sheet at y=211,
a temporary exposed feed, and a jumpable paper-jam wave. A feed hit advances the
jam to 0.65 seconds after impact, making each attack require a follow-up dodge.
The third arena is Printer, followed by Deadline and then Reviewer 2 again. `gjs tests/runner-printer.test.js`
checks armor/feed windows, duck/jump routes, special chalk and finite-ammo wins.
Tor₁ was replaced with Gal(K/F) in the obstacle pool.

Mobile controls use a left-hand movement/duck pad and large right-hand Jump/Chalk
buttons below the canvas, with audio controls placed afterward. On coarse-pointer
screens the action bar sticks to the bottom while scrolling, with safe-area padding.
Hold Chalk to repeat throws at the normal cooldown/ammo rate; pointer release,
cancellation, lost capture, pause and scene transitions stop held actions.

Direct boss practice URLs: `runner.html?boss=reviewer`, `?boss=blackboard`, or
`?boss=printer`, plus `?boss=deadline`. Press Start to enter the chosen arena immediately, with five
hearts and the usual introduction. Practice scores never update the saved best.
Invalid boss names use the regular game. To verify URL handling, run
`RUNNER_TEST_BOSS=printer gjs tests/runner-ui.test.js` (also reviewer/blackboard/invalid).

Runner challenge progression: from 12 seconds onward, curated duck/jump groups
occasionally replace a single hazard. Exam season uses denser three-step groups;
The last 20 seconds before each boss increase sequence frequency; the last 10 use
three-step groups, 1.25-second recovery spacing and two-hit endings. Pressure
resets after victory, preserves email recovery gaps, and never raises run speed
beyond its existing cap. A quiet canvas meter shows the approach.
Deadline night launches 1.35×-speed email groups with a 3.4-second recovery gap
after the last scheduled step. Group members keep the same speed, and the
arrival reservation includes the final member, preventing later spawns catching up.
Proof tiles have two HP and Reviewer Reports have three, shown as pips. Normal
chalk removes one HP; every damaging volley counts toward combo progress.
Hagoromo, shields and assistants still clear a whole obstacle in one encounter.
Reward pairs offer 10 points below or a double-jump-height reward above,
with upper hearts alternating with power-ups. The original standalone healing
heart encounters remain available. `gjs tests/runner-challenges.test.js` verifies
real scheduler groups, one-life routes at multiple speeds/frame rates, armor,
special clears, and independent reward collection/physical reachability.

Optional named leaderboard: `runner-scores.js` stores the local top 10 under
`niederdrenk-math-run-scores-v1`. After a normal Game Over, Save score accepts a
name (20 characters maximum); Skip and starting again store nothing. Names are
compared case-insensitively and only a higher personal score replaces an entry.
Scores include a date, are rendered as text, and never leave the browser. Practice
mode cannot submit scores. Storage errors are reported without interrupting play.
`gjs tests/runner-scores.test.js` covers persistence, validation, optional saving,
ranking, Unicode, safe rendering and unavailable storage.

Espresso jump: the harmless coffee-cup pickup grants a third jump for 10 seconds,
with steam pixels above the player, a third remaining-jump pip, and its own jump
cue. Works in both runner and boss arenas. Repeat pickups refresh time but never
reset the used-jump counter; mid-air expiry prevents further extra jumps until
landing. The old coffee obstacle is now an 8 AM alarm clock. Upper reward branches
advance the power-up cycle only when they offer an effect rather than a heart,
so all six power-up types (including Espresso) remain reachable in the rotation.
`gjs tests/runner-espresso.test.js` covers these rules.

Espresso animation adds a brief caffeine shiver, a hopping/winking cup with a
“ZIP!” caption on pickup, and stretch/steam jets with a “PFFT!” cloud on the
third jump. These visuals do not alter collision boxes. Their timers freeze
on pause and boss introductions, and reduced-motion mode removes shivering,
stretching and travelling clouds. Puff count and lifetime are bounded.

The Deadline is the fourth arena boss (10 HP). Its inner clock face takes chalk
hits; each hit refreshes 0.8 seconds of 0.45× mechanism/projectile speed without
stacking the duration. Minute hands run along the floor, hour hands cross at head
height, with at least 0.9 clock seconds of visual warning. It aims left or right
toward the player. At 3 HP its hand speed rises from 170 to 220 and attack intervals
fall from 2.8 to 1.7 seconds. Animated gears, clock hands, pendulum, color changes,
and a one-second gear-shatter finale use the existing pixel renderer. Reduced
motion removes decorative wobble/rotation. Practice: `runner.html?boss=deadline`.
`gjs tests/runner-deadline.test.js` covers slow timing, both dodge routes, panic,
special chalk, finite-ammo victory, rotation and animation cleanup.

Upper route rewards arrive 0.35 seconds before the ground token, allowing a
well-timed double jump and fast fall to collect both. The route ID is only a
layout marker; it never removes the uncollected item.
