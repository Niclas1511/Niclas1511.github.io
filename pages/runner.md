---
title: Math Run
lang: en
---

<div class="runner-toolbar">
    <div class="runner-scores"><span>Score <strong id="runner-score">0</strong></span><span>Best <strong id="runner-best">0</strong></span><span>Combo <strong id="runner-combo">×1</strong></span><span id="runner-phase">Lecture week</span><span>Chalk <strong id="runner-chalk-count">3</strong><span id="runner-chalk-capacity">/3</span></span></div>
    <button id="runner-pause" type="button" disabled>Pause</button>
</div>
<p id="runner-event" class="runner-event" hidden></p>
<p id="runner-effects" class="runner-effects" hidden></p>
<div class="runner-stage">
    <canvas id="runner-canvas" width="960" height="320" tabindex="0" aria-label="Math Run. Jump over low obstacles, duck under middle obstacles, and stay low when high obstacles pass. Hold Space or Up to jump higher; release for a short hop. Press again to double jump. Down to duck or fast fall. X to throw chalk at your current height. Three pieces; one recharges every four seconds. P to pause. Boss arena: A/D or Left/Right to move, mouse or touch to aim and shoot, W/S to adjust aim, X to throw.">A pixel runner game. Please use a browser that supports canvas.</canvas>
    <div class="runner-overlay" id="runner-overlay">
        <p id="runner-message">Survive the semester.</p>
        <button id="runner-start" type="button">Start</button>
    </div>
</div>
<div class="runner-actions">
    <p id="runner-controls-hint">Hold Space / ↑ jump higher · Tap twice double jump · ↓ duck / fast fall · X chalk · P pause</p>
    <div id="runner-arena-controls" class="runner-touch runner-arena-controls" hidden><button id="runner-left" type="button" disabled aria-label="Move left">← Left</button><button id="runner-right" type="button" disabled aria-label="Move right">Right →</button></div>
    <div class="runner-touch"><button id="runner-jump" type="button" disabled>↑ Jump</button><button id="runner-duck" type="button" disabled>↓ Duck</button><button id="runner-chalk" type="button" disabled>X Chalk</button></div>
</div>
<details class="runner-help">
    <summary>How to play</summary>
    <p>Hold jump for a high arc; release for a short hop. Press again for a double jump. Down ducks or speeds up your fall. Throw at your current height: duck for low targets, jump for high ones.</p>
    <p>Successful throws build a combo up to ×5: a hit at ×3 earns 15 points instead of 5. A completely missed volley resets the combo; one hit is enough to save a triple volley. Close dodges earn 10 points and restore one chalk if there is room.</p>
    <p>Choose a safe ground pickup or jump for the upper reward and dodge the obstacle behind it. Outlined power-ups give unlimited chalk (∞, 10s), triple throws (3, 10s), or invincibility (shield, 6s). Effects combine.</p>
    <p>Watch the right edge for flying obstacles. Hit a student to answer their question. Worksheets fold into harmless paper planes. Each semester phase brings new patterns; Office hours and Inbox overflow are announced in advance.</p>
    <p>Every 60 seconds of running, Reviewer 2 starts a boss arena. Scrolling stops: move with A/D or Left/Right, aim with the mouse and click to throw. On touchscreens hold the movement buttons and tap a target to aim and shoot. Keyboard only: W/S adjusts aim, X throws. Jump or move away from the announced attacks. Six chalk hits win the fight and earn 100 extra points. Chalk recharges every second in the arena. The run resumes only after victory; the next boss arrives after another 60 seconds of running.</p>
</details>
<p id="runner-status" class="runner-sr" role="status" aria-live="polite" aria-atomic="true"></p>
<noscript>Please enable JavaScript to play.</noscript>
