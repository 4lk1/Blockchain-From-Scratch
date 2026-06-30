/* API configuration and HTTP client */

class BlockchainAPI {
    constructor(baseURL = AppConfig.apiBaseUrl) {
        this.baseURL = baseURL;
    }

    async request(endpoint, method = 'GET', body = null, { silent = false, key = endpoint } = {}) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        };
        if (body) options.body = JSON.stringify(body);

        const url = `${this.baseURL}${endpoint}`;
        Logger.debug(`${method} ${endpoint}`, body || '');

        const execute = async () => {
            Logger.time(`${method} ${endpoint}`);
            let response;
            try {
                response = await fetch(url, options);
            } catch (err) {
                throw ErrorUtils.fromUnknown(err, 'Network request failed');
            } finally {
                Logger.timeEnd(`${method} ${endpoint}`);
            }

            const contentType = response.headers.get('content-type') || '';
            const payload = contentType.includes('application/json')
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                throw ErrorUtils.parseResponse(response.status, payload);
            }

            ConnectionStatus.markOnline();
            return payload;
        };

        try {
            return await Hooks.track(`api:${key}`, execute());
        } catch (err) {
            const apiErr = ErrorUtils.fromUnknown(err);
            Logger.error(`API ${method} ${endpoint}`, apiErr);

            if (apiErr.isNetworkError) {
                ConnectionStatus.markOffline(apiErr.message);
            }
            throw apiErr;
        }
    }

    static _mutate(promise, ...invalidatePrefixes) {
        return promise.then((result) => {
            ApiCache.invalidate(...invalidatePrefixes);
            return result;
        });
    }

    static health() {
        return new BlockchainAPI().request('/health', 'GET', null, { key: 'health' });
    }

    static getConfig() {
        return ApiCache.fetch('config', () => new BlockchainAPI().request('/config'), ApiCache.ttl.default);
    }

    static getDebugInfo() {
        return new BlockchainAPI().request('/debug/info', 'GET', null, { key: 'debug', silent: true });
    }

    static getChain() {
        return new BlockchainAPI().request('/chain');
    }

    static getStats() {
        return ApiCache.fetch(
            'stats',
            () => new BlockchainAPI().request('/stats', 'GET', null, { key: 'stats' }),
            ApiCache.ttl.stats,
        );
    }

    static getBlocks() {
        return ApiCache.fetch(
            'blocks:full',
            () => new BlockchainAPI().request('/blocks', 'GET', null, { key: 'blocks' }),
            ApiCache.ttl.blocks,
        );
    }

    static getBlocksSummary() {
        return ApiCache.fetch(
            'blocks:summary',
            () => new BlockchainAPI().request('/blocks?summary=true', 'GET', null, { key: 'blocks-summary' }),
            ApiCache.ttl.blocksSummary,
        );
    }

    static getBlock(index) {
        return new BlockchainAPI().request(`/blocks/${index}`, 'GET', null, { key: `block:${index}` });
    }

    static validateChain() {
        return new BlockchainAPI().request('/validate', 'GET', null, { key: 'validate' });
    }

    static getWallets() {
        return ApiCache.fetch(
            'wallets',
            () => new BlockchainAPI().request('/wallets', 'GET', null, { key: 'wallets' }),
            ApiCache.ttl.wallets,
        );
    }

    static getWallet(address) {
        return new BlockchainAPI().request(`/wallets/${address}`);
    }

    static getTransactions() {
        return ApiCache.fetch(
            'transactions',
            () => new BlockchainAPI().request('/transactions', 'GET', null, { key: 'transactions' }),
            ApiCache.ttl.transactions,
        );
    }

    static createTransaction(data) {
        return this._mutate(
            new BlockchainAPI().request('/transaction/create', 'POST', data, { key: 'tx-create' }),
            'transactions', 'stats', 'wallets', 'blocks',
        );
    }

    static createWallet(name) {
        return this._mutate(
            new BlockchainAPI().request('/wallet/create', 'POST', { name }, { key: 'wallet-create' }),
            'wallets', 'stats',
        );
    }

    static mine(minerAddress) {
        return this._mutate(
            new BlockchainAPI().request('/mine', 'POST', { miner_address: minerAddress }, { key: 'mine' }),
            'blocks', 'transactions', 'stats', 'wallets', 'analytics',
        );
    }

    static setDifficulty(difficulty) {
        return this._mutate(
            new BlockchainAPI().request('/settings/difficulty', 'POST', { difficulty }, { key: 'difficulty' }),
            'stats',
        );
    }

    static tamperBlock(data) {
        return this._mutate(
            new BlockchainAPI().request('/tamper', 'POST', data, { key: 'tamper' }),
            'blocks', 'stats', 'analytics',
        );
    }

    static perform51Attack() {
        return this._mutate(
            new BlockchainAPI().request('/attack/51percent', 'POST', null, { key: 'attack' }),
            'blocks', 'stats', 'analytics',
        );
    }

    static getAnalytics() {
        return ApiCache.fetch(
            'analytics',
            () => new BlockchainAPI().request('/analytics', 'GET', null, { key: 'analytics' }),
            ApiCache.ttl.analytics,
        );
    }

    static getPeers() {
        return ApiCache.fetch(
            'peers',
            () => new BlockchainAPI().request('/peers', 'GET', null, { key: 'peers' }),
            ApiCache.ttl.peers,
        );
    }

    static syncNetwork() {
        return this._mutate(
            new BlockchainAPI().request('/network/sync', 'POST', null, { key: 'sync' }),
            'blocks', 'stats', 'analytics', 'peers',
        );
    }

    static resetBlockchain() {
        return this._mutate(
            new BlockchainAPI().request('/reset', 'POST', null, { key: 'reset' }),
            'blocks', 'transactions', 'stats', 'wallets', 'analytics', 'peers',
        );
    }
}

window.BlockchainAPI = BlockchainAPI;
