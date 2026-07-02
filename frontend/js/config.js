/* Frontend runtime configuration */

const AppConfig = {
    defaults: {
        apiBaseUrl: 'http://localhost:8000',
        pollIntervalMs: 3000,
        pollIntervalHiddenMs: 15000,
        analyticsPollMs: 8000,
        toastDurationMs: 4200,
        debug: false,
        logLevel: 'info',
        virtualizeThreshold: 40,
        chainPreviewMax: 15,
    },

    init() {
        const meta = document.querySelector('meta[name="chain-api-url"]');
        const params = new URLSearchParams(window.location.search);
        const stored = localStorage.getItem('chain_api_url');

        if (stored) {
            this.apiBaseUrl = stored;
        } else if (meta?.hasAttribute('content')) {
            const metaUrl = (meta.getAttribute('content') ?? '').trim();
            if (metaUrl === '') {
                // Empty meta = same-origin API (Netlify _redirects proxy).
                this.apiBaseUrl = '';
            } else if (AppConfig._isLocalhostApiUrl(metaUrl) && !AppConfig._isLocalHostPage()) {
                // Built without CHAIN_API_URL — prefer same-origin proxy on hosted sites.
                this.apiBaseUrl = '';
            } else {
                this.apiBaseUrl = metaUrl;
            }
        } else {
            this.apiBaseUrl = this.defaults.apiBaseUrl;
        }

        this.debug = params.has('debug')
            || localStorage.getItem('chain_debug') === 'true'
            || this.defaults.debug;

        const level = localStorage.getItem('chain_log_level') || this.defaults.logLevel;
        this.logLevel = this.debug ? 'debug' : level;

        if (this.debug) {
            document.documentElement.dataset.debug = 'true';
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.dataset.reduceMotion = 'true';
        }
    },

    setApiBaseUrl(url) {
        this.apiBaseUrl = url;
        localStorage.setItem('chain_api_url', url);
    },

    enableDebug() {
        this.debug = true;
        localStorage.setItem('chain_debug', 'true');
        document.documentElement.dataset.debug = 'true';
        Logger.setLevel('debug');
    },

    toJSON() {
        return {
            apiBaseUrl: this.apiBaseUrl,
            debug: this.debug,
            logLevel: this.logLevel,
            pollIntervalMs: this.defaults.pollIntervalMs,
        };
    },

    /** @param {string} url */
    _isLocalhostApiUrl(url) {
        return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?\/?$/i.test(url.trim());
    },

    _isLocalHostPage() {
        const host = window.location.hostname;
        return host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
    },
};

window.AppConfig = AppConfig;
