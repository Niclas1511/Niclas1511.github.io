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
  every four seconds). Successful volleys increase a multiplier up to five; hit
  bonuses are five points times that multiplier. A completely missed volley resets
  the combo; spread shots settle together, in throw order. Algebra and
  PhD-themed motifs are defined in `MathRunner.motifs` in `runner-engine.js`.
  Six flying motifs add students with questions, urgent emails, Reviewer 2's pen,
  epsilon chased by delta, falling problem sheets, and conference invitations.
  Each flyer has an advance warning at the right edge. A chalk hit anywhere on a
  student answers their question, makes them harmless, and sends them away.
  Standing throws work; the speech bubble does not require a precision hit. Fixed obstacle speeds
  and scheduled arrival times prevent faster flyers from catching earlier hazards.
  Every fourth encounter, starting with the third, is a collectible instead of a
  hazard at ground level, plus a riskier upper reward with a trailing obstacle.
  Walk through an outlined icon: unlimited chalk lasts 10 seconds, triple
  throw lasts 10 seconds (one ammo per volley), and the animated shield lasts six
  seconds. Different effects combine; a repeat pickup refreshes its timer. Pause
  freezes the timers and restarting clears them. Items cannot be collected by shooting.
  A close dodge awards 10 points and restores up to one chalk. Worksheet hits fold
  the sheet into a harmless plane, pen hits produce red particles, and students
  acknowledge their answered question. Four 24-second phases change palettes and
  encounter patterns: Lecture week, Exam season, Conference, Deadline night.
  Office hours and Inbox overflow have two-second warnings and run for eight seconds.
  Every 60 seconds of running, after existing hazards clear, Reviewer 2 starts an
  arena fight. Scrolling, distance score, normal spawns, and the semester clock stop.
  A/D or Left/Right moves freely; mouse/touch aims and clicks/taps throw chalk.
  Keyboard-only aiming uses W/S, with X to throw. The boss moves and telegraphs
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
free movement, screen boundaries, aimed/spread throws in both directions, ammo,
attack dodge routes and victories at 30/60/120 FPS, and return to the runner.

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
