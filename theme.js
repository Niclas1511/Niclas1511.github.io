(() => {
    const root = document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    const storageKey = 'niederdrenk-theme';
    let preference;
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored === 'light' || stored === 'dark') preference = stored;
    } catch (_) { /* Use the system preference when storage is unavailable. */ }

    function applyTheme() {
        const dark = preference ? preference === 'dark' : systemTheme.matches;
        root.dataset.theme = dark ? 'dark' : 'light';
        const button = document.querySelector('.theme-toggle');
        if (button) {
            button.hidden = false;
            button.setAttribute('aria-checked', String(dark));
        }
    }

    // Apply before the stylesheet loads to avoid a flash of the wrong theme.
    applyTheme();
    systemTheme.addEventListener('change', applyTheme);
    window.addEventListener('storage', (event) => {
        if (event.key !== storageKey && event.key !== null) return;
        preference = event.newValue === 'dark' || event.newValue === 'light'
            ? event.newValue : undefined;
        applyTheme();
    });
    document.addEventListener('DOMContentLoaded', () => {
        applyTheme();
        document.querySelector('.theme-toggle').addEventListener('click', () => {
            preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
            try { localStorage.setItem(storageKey, preference); } catch (_) { }
            applyTheme();
        });
    });
})();
