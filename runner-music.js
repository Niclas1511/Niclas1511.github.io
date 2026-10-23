/* Local Standard MIDI files, synthesized with square/triangle Web Audio voices. */
var RunnerMusic = (() => {
    function parse(buffer) {
        const data = new DataView(buffer);
        let p = 0;
        const read = n => { if (p + n > data.byteLength) throw Error('Truncated MIDI'); const at = p; p += n; return at; };
        const u8 = () => data.getUint8(read(1));
        const u16 = () => data.getUint16(read(2));
        const u32 = () => data.getUint32(read(4));
        const tag = () => String.fromCharCode(...new Uint8Array(buffer, read(4), 4));
        const variable = () => { let n = 0; for (let i = 0; i < 4; i++) { const b = u8(); n = n * 128 + (b & 127); if (!(b & 128)) return n; } throw Error('Invalid MIDI delta'); };
        if (tag() !== 'MThd') throw Error('Invalid MIDI header');
        const header = u32(), start = p;
        if (header < 6) throw Error('Invalid MIDI header length');
        const format = u16(), tracks = u16(), division = u16();
        if (format > 1 || !division || division & 0x8000) throw Error('Unsupported MIDI timing');
        read(header - (p - start));
        const events = [];
        let endTick = 0;
        for (let track = 0; track < tracks; track++) {
            if (tag() !== 'MTrk') throw Error('Invalid MIDI track');
            const length = u32(), end = p + length;
            if (end > data.byteLength) throw Error('Truncated MIDI track');
            let tick = 0, running = 0;
            while (p < end) {
                tick += variable();
                let status = u8();
                if (status < 128) { if (!running) throw Error('Invalid running status'); p--; status = running; }
                if (status === 255) {
                    const type = u8(), size = variable(), at = read(size);
                    if (type === 81 && size === 3) events.push({ tick, tempo: data.getUint8(at) * 65536 + data.getUint8(at + 1) * 256 + data.getUint8(at + 2) });
                } else if (status === 240 || status === 247) { running = 0; read(variable()); }
                else {
                    if (status >= 240) throw Error('Unsupported MIDI event');
                    running = status;
                    const type = status >> 4, channel = status & 15;
                    const a = u8(), b = type === 12 || type === 13 ? 0 : u8();
                    if (type === 8 || type === 9) events.push({ tick, track, channel, pitch: a, velocity: type === 9 ? b : 0 });
                }
                if (p > end) throw Error('Invalid MIDI track length');
            }
            endTick = Math.max(endTick, tick);
        }
        events.sort((a,b) => a.tick - b.tick || (a.tempo ? -1 : b.tempo ? 1 : 0));
        let tempo = 500000, tick = 0, time = 0;
        const active = new Map(), notes = [];
        for (const event of events) {
            time += (event.tick - tick) * tempo / division / 1e6; tick = event.tick;
            if (event.tempo) { tempo = event.tempo; continue; }
            const key = `${event.track}:${event.channel}:${event.pitch}`;
            if (event.velocity) {
                if (!active.has(key)) active.set(key, []);
                active.get(key).push({ time, pitch: event.pitch, velocity: event.velocity });
            } else if (active.get(key)?.length) {
                const note = active.get(key).shift();
                notes.push({ ...note, duration: Math.max(.015, time - note.time) });
            }
        }
        const duration = time + (endTick - tick) * tempo / division / 1e6;
        for (const queue of active.values()) for (const note of queue) notes.push({ ...note, duration: Math.max(.015, duration - note.time) });
        notes.sort((a,b) => a.time - b.time);
        if (!notes.length) throw Error('Empty MIDI');
        return { notes, duration: Math.max(duration, ...notes.map(n => n.time + n.duration)) + .4 };
    }
    function create(button, select, status) {
        let context, master, song, timer, origin = 0, index = 0, generation = 0;
        let enabled = true, muted = false, running = false, boss = false, activePath = '';
        const playlist = ['assets/music/liszt-liebestraum-no-3.mid', 'assets/music/mozart-rondo-alla-turca.mid', 'assets/music/bach-prelude-c-major.mid', 'assets/music/bach-italian-concerto-1.mid', 'assets/music/bach-italian-concerto-2.mid'];
        select.value = playlist[0];
        const bossPath = 'assets/music/reviewer-2-boss.mid';
        const positions = new Map();
        const voices = new Set(), cache = new Map();
        const label = () => { button.textContent = enabled ? 'Music: on' : 'Music: off'; button.setAttribute('aria-pressed', String(enabled)); };
        function silence() {
            clearInterval(timer); timer = null;
            for (const voice of voices) { try { voice.stop(); } catch (_) { } }
            voices.clear();
        }
        function note(n, when) {
            if (voices.size >= 48) return;
            const voice = context.createOscillator(), envelope = context.createGain();
            voice.type = n.pitch < 60 ? 'triangle' : 'square';
            voice.frequency.value = 440 * 2 ** ((n.pitch - 69) / 12);
            const level = .1 * n.velocity / 127;
            envelope.gain.setValueAtTime(0, when);
            envelope.gain.linearRampToValueAtTime(level, when + .004);
            envelope.gain.exponentialRampToValueAtTime(.0001, when + Math.max(.025, n.duration));
            voice.connect(envelope); envelope.connect(master);
            voice.onended = () => { voices.delete(voice); voice.disconnect(); envelope.disconnect(); };
            voices.add(voice); voice.start(when); voice.stop(when + Math.max(.025, n.duration) + .01);
        }
        function schedule() {
            if (!song || !enabled || muted || !running || context.state !== 'running') return;
            if (index === song.notes.length) {
                if (context.currentTime < origin + song.duration) return;
                if (boss) { index = 0; origin += song.duration; }
                else {
                    select.value = playlist[(playlist.indexOf(activePath) + 1) % playlist.length];
                    positions.delete(select.value);
                    load();
                    return;
                }
            }
            const horizon = context.currentTime + .15;
            while (index < song.notes.length && origin + song.notes[index].time < horizon) {
                const n = song.notes[index];
                if (origin + n.time >= context.currentTime - .02) note(n, Math.max(context.currentTime, origin + n.time));
                index++;
            }
        }
        async function sync() {
            if (!enabled || muted || !running) { if (context) await context.suspend(); return; }
            if (!context) {
                const Audio = window.AudioContext || window.webkitAudioContext;
                context = new Audio(); master = context.createGain(); master.gain.value = .35; master.connect(context.destination);
            }
            await context.resume();
            if (!song) { await load(); return; }
            if (!timer) timer = setInterval(schedule, 25);
            schedule();
        }
        async function load() {
            const token = ++generation;
            if (song && activePath) positions.set(activePath, Math.max(0, context.currentTime - origin) % song.duration);
            silence(); song = null;
            try {
                const path = boss ? bossPath : select.value;
                if (!cache.has(path)) {
                    const response = await fetch(path);
                    if (!response.ok) throw Error('MIDI unavailable');
                    cache.set(path, parse(await response.arrayBuffer()));
                }
                if (token !== generation) return;
                song = cache.get(path); activePath = path;
                const position = positions.get(path) || 0;
                index = song.notes.findIndex(note => note.time >= position);
                if (index < 0) index = song.notes.length;
                origin = context.currentTime + .06 - position;
                await sync();
            } catch (_) {
                if (token !== generation) return;
                enabled = false; label(); silence();
                if (context) await context.suspend();
                status.textContent = 'Music unavailable. You can keep playing and try again.';
            }
        }
        async function toggle() {
            enabled = !enabled; label();
            try { await sync(); }
            catch (_) { enabled = false; label(); status.textContent = 'Music is not supported in this browser.'; }
        }
        button.addEventListener('click', toggle);
        select.addEventListener('change', () => { if (context && !boss) load(); });
        label();
        return {
            toggle,
            restart() {
                generation++; silence(); song = null; activePath = ''; positions.clear();
                boss = false; select.value = playlist[0];
            },
            next() {
                if (boss) return;
                select.value = playlist[(playlist.indexOf(select.value) + 1) % playlist.length];
                positions.delete(select.value);
                if (context) return load();
            },
            setMuted(value) { muted = value; return sync().catch(() => { enabled = false; label(); }); },
            setRunning(value) { running = value; sync().catch(() => { enabled = false; label(); }); },
            setBoss(value) {
                if (boss === value) return;
                boss = value;
                if (boss) positions.delete(bossPath);
                if (context) load();
            }
        };
    }
    return { parse, create };
})();
