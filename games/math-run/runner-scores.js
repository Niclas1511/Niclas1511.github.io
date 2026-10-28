/* Optional named scores; stored only in this browser. No network requests. */
var RunnerScores = (() => {
    const key = 'niederdrenk-math-run-scores-v1';
    function cleanName(value) {
        return typeof value === 'string' ? Array.from(value.normalize('NFC').replace(/[\u0000-\u001f\u007f]/g, '').trim().replace(/\s+/g, ' ')).slice(0, 20).join('') : '';
    }
    function normalize(entries) {
        const best = new Map();
        for (const entry of Array.isArray(entries) ? entries.slice(0, 1000) : []) {
            if (!entry || typeof entry !== 'object') continue;
            const name = cleanName(entry.name);
            if (!name || !Number.isSafeInteger(entry.score) || entry.score < 0 || typeof entry.date !== 'string' || !Number.isFinite(Date.parse(entry.date))) continue;
            const record = { name, score: entry.score, date: new Date(entry.date).toISOString() };
            const id = name.toLowerCase(), previous = best.get(id);
            if (!previous || record.score > previous.score) best.set(id, record);
        }
        return [...best.values()].sort((a,b) => b.score - a.score || a.date.localeCompare(b.date) || a.name.localeCompare(b.name)).slice(0, 10);
    }
    function read(storage) {
        try {
            const text = storage.getItem(key);
            let entries;
            try { entries = JSON.parse(text || '[]'); } catch (_) { entries = []; }
            return { entries: normalize(entries), available: true };
        } catch (_) { return { entries: [], available: false }; }
    }
    function record(storage, name, score, date = new Date().toISOString()) {
        name = cleanName(name);
        if (!name || !Number.isSafeInteger(score) || score < 0 || !Number.isFinite(Date.parse(date))) return { ok: false, reason: 'Enter a name to save, or choose Skip.' };
        const current = read(storage);
        if (!current.available) return { ok: false, reason: 'Local storage is unavailable. Your score could not be saved.' };
        const previous = current.entries.find(entry => entry.name.toLowerCase() === name.toLowerCase());
        const improved = !previous || score > previous.score;
        const entries = normalize([...current.entries.filter(entry => improved ? entry.name.toLowerCase() !== name.toLowerCase() : true), ...(improved ? [{ name, score, date }] : [])]);
        try { storage.setItem(key, JSON.stringify(entries)); }
        catch (_) { return { ok: false, reason: 'Local storage is unavailable. Your score could not be saved.' }; }
        return { ok: true, entries, improved, ranked: entries.some(entry => entry.name.toLowerCase() === name.toLowerCase()) };
    }
    function create(elements, storage, doc = document) {
        const { form, input, save, skip, list, message, status, feedback } = elements;
        let pending = null;
        function render(entries = read(storage).entries) {
            list.replaceChildren(...entries.map(entry => {
                const item = doc.createElement('li');
                const date = new Date(entry.date).toLocaleDateString('en-GB');
                item.textContent = `${entry.name} · ${entry.score} · ${date}`;
                return item;
            }));
            message.textContent = read(storage).available ? entries.length ? 'Best score per name · stored in this browser only.' : 'No saved scores yet. Stored in this browser only.' : 'Local storage is unavailable in this browser.';
        }
        function dismiss() { pending = null; form.hidden = true; input.value = ''; if (feedback) feedback.textContent = ''; }
        form.addEventListener('submit', event => {
            event.preventDefault();
            if (pending === null) return;
            const result = record(storage, input.value, pending);
            if (!result.ok) { status.textContent = result.reason; if (feedback) feedback.textContent = result.reason; return; }
            render(result.entries); dismiss();
            const details = list.closest?.('details'); if (details) details.open = true;
            status.textContent = !result.ranked ? 'This score did not reach the current top 10.' : result.improved ? 'Score saved on this browser.' : 'Your higher personal best was kept.';
        });
        skip.addEventListener('click', dismiss);
        render(); dismiss();
        return {
            dismiss,
            offer(score) {
                pending = score; input.value = ''; form.hidden = false;
                save.disabled = !read(storage).available;
                if (feedback) feedback.textContent = save.disabled ? 'Scores cannot be saved: local storage is unavailable. You can choose Skip.' : '';
            }
        };
    }
    return { cleanName, normalize, read, record, create };
})();
