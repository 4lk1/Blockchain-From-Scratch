/* In-memory API response cache with request deduplication */

const ApiCache = {
    store: new Map(),
    inflight: new Map(),

    ttl: {
        stats: 1500,
        transactions: 1200,
        blocks: 4000,
        blocksSummary: 4000,
        wallets: 8000,
        analytics: 5000,
        peers: 10000,
        default: 3000,
    },

    get(key) {
        const entry = this.store.get(key);
        if (!entry) return undefined;
        if (Date.now() > entry.expires) {
            this.store.delete(key);
            return undefined;
        }
        return entry.data;
    },

    set(key, data, ttlMs) {
        this.store.set(key, { data, expires: Date.now() + ttlMs });
    },

    invalidate(...prefixes) {
        if (!prefixes.length) {
            this.store.clear();
            return;
        }
        for (const key of this.store.keys()) {
            if (prefixes.some(p => key.startsWith(p))) {
                this.store.delete(key);
            }
        }
    },

    async fetch(key, fetcher, ttlMs = this.ttl.default) {
        const cached = this.get(key);
        if (cached !== undefined) {
            Logger.debug('Cache hit', key);
            return cached;
        }

        if (this.inflight.has(key)) {
            Logger.debug('Deduped request', key);
            return this.inflight.get(key);
        }

        const promise = Promise.resolve()
            .then(fetcher)
            .then((data) => {
                this.set(key, data, ttlMs);
                this.inflight.delete(key);
                return data;
            })
            .catch((err) => {
                this.inflight.delete(key);
                throw err;
            });

        this.inflight.set(key, promise);
        return promise;
    },
};

window.ApiCache = ApiCache;
