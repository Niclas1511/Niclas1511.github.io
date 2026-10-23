/* Short synthesized effects; no samples, downloads, or music dependency. */
var RunnerSound = (() => {
    // Frequency sweep, duration, oscillator, and optional second note.
    const cues = {
        start: [330,660,.16,'square',880], resume: [440,660,.09,'triangle'], pause: [440,220,.09,'triangle'],
        jump: [220,520,.12,'square'], doubleJump: [390,850,.14,'square'], land: [120,55,.06,'triangle'],
        duck: [220,95,.07,'triangle'], fall: [500,120,.1,'triangle'],
        empty: [100,80,.05,'square'], throw: [900,350,.07,'triangle'], spread: [650,1300,.1,'square'], homing: [400,1100,.14,'triangle'],
        dive: [1200,320,.08,'sawtooth'], giant: [130,420,.2,'square'],
        hit: [240,65,.08,'noise'], smash: [700,70,.18,'noise'], explosion: [140,35,.4,'noise'],
        answered: [520,780,.1,'triangle',1040], fold: [600,200,.08,'noise'],
        pickup: [440,660,.12,'square',880], hire: [330,550,.13,'triangle',825],
        helperJump: [200,400,.1,'triangle'], ouch: [400,120,.16,'square'],
        hurt: [210,65,.18,'square'], heal: [523,659,.14,'triangle',784],
        reward: [440,880,.2,'square',1320],
        shield: [1000,500,.12,'triangle'],
        boss: [110,165,.3,'square',220], attack: [180,75,.14,'sawtooth'], bossHit: [280,90,.12,'square'],
        victory: [440,880,.25,'square',1320], over: [392,98,.8,'triangle']
    };
    function create(button, status) {
        let context, master, noise, enabled = true, muted = false;
        const voices = new Set(), last = new Map();
        function label() { button.textContent = enabled ? 'Sound: on' : 'Sound: off'; button.setAttribute('aria-pressed', String(enabled)); }
        function stop() {
            for (const voice of voices) { try { voice.stop(); } catch (_) { } }
            voices.clear(); last.clear();
        }
        function unlock() {
            if (!enabled || muted) return;
            try {
                if (!context) {
                    const Audio = window.AudioContext || window.webkitAudioContext;
                    context = new Audio(); master = context.createGain(); master.gain.value = .22; master.connect(context.destination);
                    noise = context.createBuffer(1, context.sampleRate * .5, context.sampleRate);
                    const samples = noise.getChannelData(0);
                    let seed = 12345;
                    for (let i = 0; i < samples.length; i++) { seed = (seed * 16807) % 2147483647; samples[i] = seed / 1073741824 - 1; }
                }
                return context.resume().catch(fail);
            } catch (_) { fail(); }
        }
        function fail() { enabled = false; stop(); label(); status.textContent = 'Sound effects are unavailable in this browser.'; }
        function play(name) {
            if (!enabled || muted || !context || context.state !== 'running' || !cues[name]) return;
            const now = context.currentTime;
            if (now - (last.get(name) ?? -Infinity) < .07) return;
            if (name === 'over') stop();
            if (voices.size >= 20) return;
            last.set(name, now);
            const [from,to,duration,type,second] = cues[name];
            function voice(start, a, b, length) {
                if (voices.size >= 20) return;
                const source = type === 'noise' ? context.createBufferSource() : context.createOscillator();
                const envelope = context.createGain();
                if (type === 'noise') { source.buffer = noise; source.playbackRate.setValueAtTime(1, start); source.playbackRate.exponentialRampToValueAtTime(.3, start + length); }
                else { source.type = type; source.frequency.setValueAtTime(a, start); source.frequency.exponentialRampToValueAtTime(b, start + length); }
                envelope.gain.setValueAtTime(.0001, start);
                envelope.gain.linearRampToValueAtTime(type === 'noise' ? .45 : .25, start + .003);
                envelope.gain.exponentialRampToValueAtTime(.0001, start + length);
                source.connect(envelope); envelope.connect(master); voices.add(source);
                source.onended = () => { voices.delete(source); source.disconnect(); envelope.disconnect(); };
                source.start(start); source.stop(start + length + .01);
            }
            if (name === 'over') {
                // G4–E-flat4–C4–C3: a falling minor phrase with a low final sigh.
                for (const [offset, pitch, end, length] of [[0,392,392,.14],[.17,311.13,311.13,.14],[.34,261.63,261.63,.2],[.58,130.81,98,.42]]) {
                    voice(now + offset, pitch, end, length);
                }
                return;
            }
            voice(now, from, to, duration);
            if (second) voice(now + duration * .7, to, second, duration * .7);
        }
        button.addEventListener('click', () => { enabled = !enabled; label(); if (enabled) { unlock()?.then(() => play('pickup')); } else stop(); });
        label();
        return { unlock, play, stop, setMuted(value) { muted = value; if (muted) stop(); else if (context) unlock(); }, drain(state) { for (const cue of state.sounds.splice(0)) play(cue); } };
    }
    return { create, cues };
})();
