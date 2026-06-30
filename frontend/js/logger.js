/* Namespaced logger with level filtering */

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, silent: 4 };

const Logger = {
    level: 'info',
    prefix: '[ChainExplorer]',

    init() {
        this.setLevel(AppConfig.logLevel || 'info');
    },

    setLevel(level) {
        this.level = level in LOG_LEVELS ? level : 'info';
    },

    _shouldLog(level) {
        return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
    },

    debug(...args) {
        if (this._shouldLog('debug')) console.debug(this.prefix, ...args);
    },

    info(...args) {
        if (this._shouldLog('info')) console.info(this.prefix, ...args);
    },

    warn(...args) {
        if (this._shouldLog('warn')) console.warn(this.prefix, ...args);
    },

    error(...args) {
        if (this._shouldLog('error')) console.error(this.prefix, ...args);
    },

    group(label, fn) {
        if (!this._shouldLog('debug')) return fn();
        console.groupCollapsed(`${this.prefix} ${label}`);
        try {
            return fn();
        } finally {
            console.groupEnd();
        }
    },

    time(label) {
        if (this._shouldLog('debug')) console.time(`${this.prefix} ${label}`);
    },

    timeEnd(label) {
        if (this._shouldLog('debug')) console.timeEnd(`${this.prefix} ${label}`);
    },
};

window.Logger = Logger;
