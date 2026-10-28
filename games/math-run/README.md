# Math Run

All game source, assets and tests are kept in this directory.

- `runner.md`: page content and controls.
- `runner.css`: page styles.
- `runner.js`: game rendering, inputs and UI.
- `runner-engine.js`: simulation, encounters and bosses.
- `runner-cosmetics.js`: shared character and environment cosmetics.
- `runner-lookbook.js`: independent semester appearance preview.
- `runner-music.js`, `runner-sound.js`: music and synthesized effects.
- `runner-scores.js`: browser-local scores.
- `music/`: MIDI files and source/license credits.
- `tests/`: simulation, audio, rendering and UI checks.

The site builder at the repository root includes `runner.md` and generates the
public entry page at `/runner.html`. Keep that URL for bookmarks, navigation and
boss-training query strings. The generated HTML is the only game file remaining
at the root. Asset URLs are relative to that root entry, including `music/` URLs.

From the repository root, build the website with `python3 build.py`.
Run the game tests with:

```sh
for test in games/math-run/tests/runner*.test.js; do
    gjs "$test" || exit 1
done
```

Reduced-motion UI checks:

```sh
RUNNER_TEST_REDUCED_MOTION=1 gjs games/math-run/tests/runner-ui.test.js
```
