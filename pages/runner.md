---
title: Math Run
lang: en
---

<div class="runner-toolbar">
    <div class="runner-scores"><span>Lives <strong id="runner-lives" aria-label="1 of 5 lives">♥♡♡♡♡</strong></span><span>Score <strong id="runner-score">0</strong></span><span>Best <strong id="runner-best">0</strong></span><span>Combo <strong id="runner-combo">×1</strong></span><span id="runner-phase">Lecture week</span><span>Chalk <strong id="runner-chalk-count">3</strong><span id="runner-chalk-capacity">/3</span></span></div>
    <button id="runner-pause" type="button" disabled>Pause</button>
</div>
<div class="runner-messages">
    <p id="runner-event" class="runner-event" hidden></p>
    <p id="runner-effects" class="runner-effects" hidden></p>
</div>
<div class="runner-stage">
    <canvas id="runner-canvas" width="960" height="320" tabindex="0" aria-label="Math Run. Jump over low obstacles, duck under middle obstacles, and stay low when high obstacles pass. Hold Space or Up to jump higher; release for a short hop. Press again to double jump. Down to duck or fast fall. X to throw chalk at your current height. Three pieces; one recharges every four seconds. P to pause. M to mute or unmute all game audio. Boss arena: Left/Right moves, Space jumps, X throws. Throws follow your facing direction; jump to aim at boss height.">A pixel runner game. Please use a browser that supports canvas.</canvas>
    <div class="runner-overlay" id="runner-overlay">
        <p id="runner-message">Survive the semester.</p>
        <button id="runner-start" type="button">Start · Space</button>
    </div>
</div>
<form id="runner-save-score" class="runner-save-score" hidden>
    <p>Save this run? Your name is optional; scores stay in this browser.</p>
    <label for="runner-score-name">Name</label>
    <input id="runner-score-name" type="text" maxlength="20" autocomplete="nickname" required>
    <button id="runner-score-save" type="submit">Save score</button>
    <button id="runner-score-skip" type="button">Skip</button>
    <p id="runner-score-feedback" role="status"></p>
</form>
<div class="runner-actions">
    <p id="runner-controls-hint">Hold Space / ↑ jump higher · Tap twice double jump · ↓ duck / fast fall · X chalk · P pause · M mute all · N next track</p>
    <div id="runner-touch-controls" class="runner-touch-controls" data-arena="false">
        <div class="runner-direction-controls">
            <div id="runner-arena-controls" class="runner-touch runner-arena-controls" hidden><button id="runner-left" type="button" disabled aria-label="Move left">←</button><button id="runner-right" type="button" disabled aria-label="Move right">→</button></div>
            <button id="runner-duck" type="button" disabled aria-label="Hold to duck or fall faster">↓<span>Duck</span></button>
        </div>
        <div class="runner-touch runner-primary-controls"><button id="runner-jump" type="button" disabled aria-label="Hold to jump higher; press twice to double jump">↑<span>Jump</span></button><button id="runner-chalk" type="button" disabled aria-label="Hold to throw chalk repeatedly">✦<span>Chalk</span></button></div>
    </div>
</div>
<div class="runner-music">
    <button id="runner-mute" type="button" aria-pressed="false">Mute · M</button>
    <button id="runner-sound" type="button" aria-pressed="true">Sound: on</button>
    <button id="runner-music" type="button" aria-pressed="true">Music: on</button>
    <button id="runner-next-track" type="button" disabled>Next · N</button>
    <label for="runner-track" class="runner-sr">Music track</label>
    <select id="runner-track"><option value="assets/music/liszt-liebestraum-no-3.mid">Liszt · Liebestraum No. 3</option><option value="assets/music/mozart-rondo-alla-turca.mid">Mozart · Rondo alla Turca</option><option value="assets/music/bach-prelude-c-major.mid">Bach · Prelude in C major</option><option value="assets/music/bach-italian-concerto-1.mid">Bach · Italian Concerto I</option><option value="assets/music/bach-italian-concerto-2.mid">Bach · Italian Concerto II — Andante</option></select>
</div>
<details class="runner-leaderboard">
    <summary>Local leaderboard</summary>
    <ol id="runner-score-list"></ol>
    <p id="runner-score-list-message"></p>
</details>
<details class="runner-help">
    <summary>How to play</summary>
    <p>Start with one life. Collect pixel hearts to restore one life, up to five. Getting hit costs one heart and grants 1.5 seconds of protection, shown by blinking. Your remaining lives carry into boss fights. Game over happens only when no hearts remain.</p>
    <p>Italian Concerto MIDI edition: Boris Dušek and Jay Anderson, <a href="https://www.mutopiaproject.org/cgibin/piece-info.cgi?id=1826">Mutopia Project</a>, <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>. MIDI files are unchanged.</p>
    <p>Music starts with the game. Press M to mute or unmute all music and sound effects. Each new run starts with a random classical piece from the MIDI collection. Press N or Next to skip a classical track. Pieces play in sequence: Liszt, Mozart, Bach, then the first and second movements of Bach’s Italian Concerto. Boss battles have their own theme. Pausing or ending the game stops playback.</p>
    <p>Hold jump for a high arc; release for a short hop. Press again for a double jump. Down ducks or speeds up your fall. Throw at your current height: duck for low targets, jump for high ones.</p>
    <p>Each successful throw increases your combo multiplier without a cap: a hit at ×3 earns 15 points, at ×10 it earns 50. A completely missed volley resets the combo; one hit is enough to save a triple volley. Every 10 successful throws in a row unlocks a giant Hagoromo chalk for your next throw: it explodes, clears nearby obstacles and enemy shots, and deals three boss damage. Each volley counts once, even with multiple hits. The reward costs no normal chalk. Close dodges earn 10 points and restore one chalk if there is room.</p>
    <p>Collect a safe ground token for 10 points, or double-jump for the upper heart or power-up and fast-fall past the trailing obstacle. Both rewards stay visible until collected or scrolled off screen. The upper reward arrives slightly earlier, so a well-timed jump and fast fall can collect both. Outlined power-ups give unlimited chalk (∞, 10s), triple throws (3, 10s), invincibility (shield, 6s), homing chalk (H, 10s), Espresso jump (coffee cup, 10s, adds a third jump with steam pixels), or another student assistant (figure icon, five lives without a time limit). Effects combine.</p>
    <p>Short sequences combine ducking and jumping. Read the pattern label before it arrives. Proof tiles need two chalk hits; Reviewer Reports need three, shown by the bars above them. Shield, assistants and Hagoromo still clear them in one encounter. The final 20 seconds before each boss build pressure: more sequences, shorter recovery gaps in the final 10 seconds, and two-hit sequence endings. A small meter marks the approach; pressure resets after the boss. Exam season brings denser duck/jump sequences; Deadline night brings fast email bursts followed by recovery gaps.</p>
    <p>Watch the right edge for flying obstacles. Hit a student to answer their question. Worksheets fold into harmless paper planes. Each semester phase brings new patterns; Office hours and Inbox overflow are announced in advance.</p>
    <p>Every 60 seconds of running, a boss arena starts. Reviewer 2, The Blackboard, The Printer, and The Deadline appear in order. Scrolling stops. Use Left/Right to move, Space to jump, Down to duck or fast fall, and X to throw. Face the boss with Left/Right and jump to align your chalk with its height. Reviewer 2 changes position and then holds still briefly: use those openings while dodging its attacks. Only the Homing chalk power-up steers toward targets. Student assistants stay until their five lives run out, including in arenas where they intercept hostile shots. On touchscreens use the left-side direction pad and Duck button, and the large Jump and Chalk buttons on the right. Hold Chalk for repeated throws; hold Jump for height, or tap twice for a double jump. Reviewer 2 takes six hits. The Blackboard shifts up and down while drawing and takes eight hits: dodge its bouncing parabola and sine wave, then jump and hit the exposed eraser after it finishes drawing. The board itself blocks chalk, including Homing chalk. Hagoromo deals three damage only while the eraser is exposed. The Printer also takes eight hits: duck under incoming sheets, throw into its golden open feed, then jump over the paper-jam wave. Hitting the feed triggers the wave after a short warning. The Deadline takes ten face hits: jump over the low minute hand and duck under the higher hour hand. Hitting its face slows the clock and its flying hands briefly; the last three HP trigger a faster final countdown. Winning earns 100 extra points. Chalk recharges every second in the arena. Rare power-ups appear high above the floor: reach them with a double jump before their 6.5-second timer expires. The run resumes only after victory; the next boss arrives after another 60 seconds of running.</p>
</details>
<p id="runner-status" class="runner-sr" role="status" aria-live="polite" aria-atomic="true"></p>
<noscript>Please enable JavaScript to play.</noscript>
