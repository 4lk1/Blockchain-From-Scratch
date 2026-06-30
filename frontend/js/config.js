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

        this.apiBaseUrl = meta?.content?.trim()
            || localStorage.getItem('chain_api_url')
            || this.defaults.apiBaseUrl;

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
};

window.AppConfig = AppConfig;
