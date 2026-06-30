/* Theme management — light / dark / system */

const ThemeManager = {
    STORAGE_KEY: 'chain-explorer-theme',

    init() {
        const saved = localStorage.getItem(this.STORAGE_KEY);
        const theme = saved || 'system';
        this.apply(theme);
        this.bindToggle();
    },

    getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    },

    resolve(theme) {
        return theme === 'system' ? this.getSystemTheme() : theme;
    },

    apply(theme) {
        const resolved = this.resolve(theme);
        document.documentElement.setAttribute('data-theme', resolved);
        document.documentElement.setAttribute('data-theme-preference', theme);
        localStorage.setItem(this.STORAGE_KEY, theme);

        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
            meta.content = resolved === 'dark' ? '#09090b' : '#ffffff';
        }

        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.setAttribute('aria-label', `Switch to ${resolved === 'dark' ? 'light' : 'dark'} mode`);
        }

        document.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: resolved } }));
    },

    cycle() {
        const order = ['light', 'dark', 'system'];
        const current = document.documentElement.getAttribute('data-theme-preference') || 'system';
        const next = order[(order.indexOf(current) + 1) % order.length];
        this.apply(next);
        Toast.show(`Theme: ${next}`, 'info');
    },

    bindToggle() {
        const toggle = document.getElementById('themeToggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.cycle());
        }

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
            const pref = document.documentElement.getAttribute('data-theme-preference');
            if (pref === 'system') this.apply('system');
        });
    },
};
