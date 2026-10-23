---
title: Math Run
lang: en
---

<div class="runner-toolbar">
    <div class="runner-scores"><span>Score <strong id="runner-score">0</strong></span><span>Best <strong id="runner-best">0</strong></span><span>Combo <strong id="runner-combo">×1</strong></span><span id="runner-phase">Lecture week</span><span>Chalk <strong id="runner-chalk-count">3</strong><span id="runner-chalk-capacity">/3</span></span></div>
    <button id="runner-pause" type="button" disabled>Pause</button>
</div>
<div class="runner-messages">
    <p id="runner-event" class="runner-event" hidden></p>
    <p id="runner-effects" class="runner-effects" hidden></p>
</div>
<div class="runner-stage">
    <canvas id="runner-canvas" width="960" height="320" tabindex="0" aria-label="Math Run. Jump over low obstacles, duck under middle obstacles, and stay low when high obstacles pass. Hold Space or Up to jump higher; release for a short hop. Press again to double jump. Down to duck or fast fall. X to throw chalk at your current height. Three pieces; one recharges every four seconds. P to pause. M to mute or unmute game music. Boss arena: Left/Right moves, Space jumps, X throws. Throws follow your facing direction; jump to aim at boss height.">A pixel runner game. Please use a browser that supports canvas.</canvas>
    <div class="runner-overlay" id="runner-overlay">
        <p id="runner-message">Survive the semester.</p>
        <button id="runner-start" type="button">Start · Space</button>
    </div>
</div>
<div class="runner-music">
    <button id="runner-sound" type="button" aria-pressed="true">Sound: on</button>
    <button id="runner-music" type="button" aria-pressed="true">Music: on · M</button>
    <label for="runner-track" class="runner-sr">Music track</label>
    <select id="runner-track"><option value="assets/music/mozart-rondo-alla-turca.mid">Mozart · Rondo alla Turca</option><option value="assets/music/bach-prelude-c-major.mid">Bach · Prelude in C major</option><option value="assets/music/liszt-liebestraum-no-3.mid">Liszt · Liebestraum No. 3</option></select>
</div>
<div class="runner-actions">
    <p id="runner-controls-hint">Hold Space / ↑ jump higher · Tap twice double jump · ↓ duck / fast fall · X chalk · P pause · M mute music</p>
    <div id="runner-arena-controls" class="runner-touch runner-arena-controls" hidden><button id="runner-left" type="button" disabled aria-label="Move left">← Left</button><button id="runner-right" type="button" disabled aria-label="Move right">Right →</button></div>
    <div class="runner-touch"><button id="runner-jump" type="button" disabled>↑ Jump</button><button id="runner-duck" type="button" disabled>↓ Duck</button><button id="runner-chalk" type="button" disabled>X Chalk</button></div>
</div>
<details class="runner-help">
    <summary>How to play</summary>
    <p>Music starts with the game. Press M to mute or unmute. Classical pieces play in sequence: Mozart, Bach, then Liszt. Boss battles have their own theme. Pausing or ending the game stops playback.</p>
    <p>Hold jump for a high arc; release for a short hop. Press again for a double jump. Down ducks or speeds up your fall. Throw at your current height: duck for low targets, jump for high ones.</p>
    <p>Each successful throw increases your combo multiplier without a cap: a hit at ×3 earns 15 points, at ×10 it earns 50. A completely missed volley resets the combo; one hit is enough to save a triple volley. Every 10 successful throws in a row unlocks a giant Hagoromo chalk for your next throw: it explodes, clears nearby obstacles and enemy shots, and deals three boss damage. Each volley counts once, even with multiple hits. The reward costs no normal chalk. Close dodges earn 10 points and restore one chalk if there is room.</p>
    <p>Choose a safe ground pickup or jump for the upper reward and dodge the obstacle behind it. Outlined power-ups give unlimited chalk (∞, 10s), triple throws (3, 10s), invincibility (shield, 6s), homing chalk (H, 10s), or another student assistant (figure icon, five lives without a time limit). Effects combine.</p>
    <p>Watch the right edge for flying obstacles. Hit a student to answer their question. Worksheets fold into harmless paper planes. Each semester phase brings new patterns; Office hours and Inbox overflow are announced in advance.</p>
    <p>Every 60 seconds of running, Reviewer 2 starts a boss arena. Scrolling stops. You only need Left/Right to move, Space to jump, and X to throw. Face the boss with Left/Right and jump to align your chalk with its height. The boss changes position and then holds still briefly: use those openings while dodging its attacks. Only the Homing chalk power-up steers toward targets. Student assistants stay until their five lives run out, including in arenas where they intercept hostile shots. On touchscreens use the move, jump and chalk buttons. Six chalk hits win the fight and earn 100 extra points. Chalk recharges every second in the arena. The run resumes only after victory; the next boss arrives after another 60 seconds of running.</p>
</details>
<p id="runner-status" class="runner-sr" role="status" aria-live="polite" aria-atomic="true"></p>
<noscript>Please enable JavaScript to play.</noscript>
