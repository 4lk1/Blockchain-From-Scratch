/* Visibility-aware polling and batched DOM scheduling */

const Scheduler = {
    _rafQueue: new Map(),
    _visible: !document.hidden,

    init() {
        document.addEventListener('visibilitychange', () => {
            this._visible = !document.hidden;
            Logger.debug(this._visible ? 'Tab visible — resume work' : 'Tab hidden — pause heavy work');
            if (this._visible) {
                document.dispatchEvent(new CustomEvent('app:visible'));
            } else {
                document.dispatchEvent(new CustomEvent('app:hidden'));
            }
        });
    },

    get isVisible() {
        return this._visible;
    },

    /** Batch DOM writes into a single animation frame */
    schedule(key, fn) {
        if (this._rafQueue.has(key)) {
            cancelAnimationFrame(this._rafQueue.get(key).id);
        }

        const entry = { fn };
        entry.id = requestAnimationFrame(() => {
            this._rafQueue.delete(key);
            try {
                entry.fn();
            } catch (err) {
                Logger.error('Scheduled render failed', err);
            }
        });
        this._rafQueue.set(key, entry);
    },

    /** Create a poll loop that pauses when the tab is hidden */
    createPoller(fn, intervalMs, { immediate = true } = {}) {
        let timer = null;

        const tick = async () => {
            if (!Scheduler.isVisible) return;
            try {
                await fn();
            } catch (err) {
                Logger.debug('Poll tick failed', err);
            }
        };

        const start = () => {
            if (timer) return;
            if (immediate) tick();
            timer = setInterval(tick, intervalMs);
        };

        const stop = () => {
            if (timer) clearInterval(timer);
            timer = null;
        };

        const onVisible = () => {
            if (Scheduler.isVisible) {
                tick();
                start();
            }
        };

        document.addEventListener('app:visible', onVisible);
        document.addEventListener('app:hidden', stop);

        start();

        return {
            stop: () => {
                stop();
                document.removeEventListener('app:visible', onVisible);
                document.removeEventListener('app:hidden', stop);
            },
        };
    },
};

window.Scheduler = Scheduler;
