/* Reusable async and DOM utilities (vanilla "hooks") */

const Hooks = {
    /** Track in-flight requests by key for loading indicators */
    pending: new Map(),
    listeners: new Set(),

    subscribe(fn) {
        this.listeners.add(fn);
        return () => this.listeners.delete(fn);
    },

    _notify() {
        this.listeners.forEach(fn => fn(this.pending));
    },

    isPending(key) {
        return this.pending.has(key);
    },

    async track(key, promise) {
        this.pending.set(key, Date.now());
        this._notify();
        try {
            return await promise;
        } finally {
            this.pending.delete(key);
            this._notify();
        }
    },

    /** Wrap an async function with loading + error handling */
    withAsync(key, fn, { onError = null, silent = false } = {}) {
        return async (...args) => {
            try {
                return await this.track(key, fn(...args));
            } catch (err) {
                const apiErr = ErrorUtils.fromUnknown(err);
                Logger.error(`[${key}]`, apiErr);
                if (onError) onError(apiErr);
                else if (!silent) ErrorUtils.notify(apiErr);
                throw apiErr;
            }
        };
    },

    /** Debounce for search/input handlers */
    debounce(fn, waitMs = 300) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            return new Promise(resolve => {
                timer = setTimeout(async () => resolve(await fn(...args)), waitMs);
            });
        };
    },

    /** Run callback when DOM is ready */
    onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    },

    /** Persist view preference */
    useStorage(key, defaultValue) {
        return {
            get() {
                try {
                    const raw = localStorage.getItem(key);
                    return raw !== null ? JSON.parse(raw) : defaultValue;
                } catch {
                    return defaultValue;
                }
            },
            set(value) {
                localStorage.setItem(key, JSON.stringify(value));
            },
        };
    },
};

window.Hooks = Hooks;
