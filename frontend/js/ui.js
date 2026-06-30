/* DOM rendering and visual state */

const UIHelpers = {
    escape(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    truncate(value, start = 8, end = 6) {
        if (!value || value.length <= start + end + 3) return value || '—';
        return `${value.slice(0, start)}…${value.slice(-end)}`;
    },

    walletLabel(address, walletsOrIndex) {
        if (walletsOrIndex instanceof Map) {
            return RenderUtils.walletLabel(address, walletsOrIndex);
        }
        const wallet = (walletsOrIndex || []).find(w => w.address === address);
        return wallet?.name || this.truncate(address, 6, 4);
    },

    renderBlockChip(block, idx, total) {
        const txCount = block.transaction_count ?? block.transactions?.length ?? 0;
        return `
            <div class="block-chip">
                <div class="block-chip__index">Block ${block.index}</div>
                <div class="block-chip__hash">${this.truncate(block.hash, 8, 6)}</div>
                <div class="block-chip__meta">${txCount} tx · nonce ${block.nonce ?? 0}</div>
            </div>
            ${idx < total - 1 ? '<span class="chain-connector" aria-hidden="true">→</span>' : ''}
        `;
    },

    setStatus(valid) {
        const dot = document.getElementById('chainValid');
        const integrity = document.getElementById('integrityStatus');
        const chainValidBadge = document.getElementById('chain-valid');

        if (dot) {
            dot.classList.toggle('status-dot--valid', valid);
            dot.classList.toggle('status-dot--invalid', !valid);
        }
        if (integrity) {
            integrity.textContent = valid ? 'Network valid' : 'Network invalid';
        }
        if (chainValidBadge) {
            chainValidBadge.textContent = valid ? 'Valid' : 'Invalid';
            chainValidBadge.className = `stat-card__value badge ${valid ? 'badge--success' : 'badge--danger'}`;
            chainValidBadge.setAttribute('aria-label', valid ? 'Chain status: valid' : 'Chain status: invalid');
        }
    },
};

class UIRenderer {
    constructor() {
        this.state = {
            chain: [],
            wallets: [],
            transactions: [],
            stats: null,
        };
        this._walletIndex = new Map();
        this._fingerprints = {
            stats: '',
            blocks: '',
            wallets: '',
            transactions: '',
        };
        this._blocksVirtual = null;
    }

    applyStats(stats) {
        const fp = RenderUtils.fingerprintStats(stats);
        if (fp === this._fingerprints.stats) return;
        this._fingerprints.stats = fp;

        this.state.stats = stats;
        const valid = !!stats.chain_valid;

        const map = {
            navBlocks: stats.total_blocks ?? 1,
            navWallets: stats.total_wallets ?? 0,
            navDifficulty: stats.mining_difficulty ?? stats.difficulty ?? 3,
            chainLength: stats.total_blocks ?? 1,
            pendingTxCount: stats.pending_transactions ?? 0,
            'total-blocks': stats.total_blocks ?? 0,
            'total-transactions': stats.total_transactions ?? 0,
            'total-wallets': stats.total_wallets ?? 0,
        };

        Scheduler.schedule('stats-dom', () => {
            Object.entries(map).forEach(([id, value]) => {
                RenderUtils.setTextIfChanged(document.getElementById(id), value);
            });
            UIHelpers.setStatus(valid);
        });
    }

    async renderStats() {
        return Hooks.withAsync('stats', async () => {
            const stats = await BlockchainAPI.getStats();
            this.applyStats(stats);
        }, { silent: true })();
    }

    async renderCurrentStats() {
        try {
            const stats = await BlockchainAPI.getStats();
            this.applyStats(stats);
        } catch (err) {
            Logger.debug('Stats poll failed', err);
        }
    }

    renderBlockRow(block) {
        const miner = block.miner_address || '—';
        const txCount = block.transaction_count ?? block.transactions?.length ?? 0;
        const time = block.timestamp
            ? new Date(block.timestamp * 1000).toLocaleString()
            : '—';

        return `
            <tr>
                <td><strong>#${block.index}</strong></td>
                <td><code class="addr-link">${UIHelpers.truncate(block.hash, 10, 8)}</code></td>
                <td>${txCount}</td>
                <td><code class="addr-link">${UIHelpers.truncate(miner, 8, 4)}</code></td>
                <td>${block.nonce ?? 0}</td>
                <td class="text-muted">${time}</td>
            </tr>
        `;
    }

    _mountBlocksVirtual(blocksReversed) {
        const scroller = document.getElementById('blocksVirtualScroll');
        const tbody = document.getElementById('blocksTableBody');
        if (!scroller || !tbody) return;

        const threshold = AppConfig.defaults.virtualizeThreshold ?? 40;
        if (blocksReversed.length < threshold) {
            this._blocksVirtual?.destroy();
            this._blocksVirtual = null;
            tbody.innerHTML = blocksReversed.map(b => this.renderBlockRow(b)).join('');
            return;
        }

        if (!this._blocksVirtual) {
            this._blocksVirtual = new VirtualList({
                scroller,
                tbody,
                items: blocksReversed,
                rowHeight: 44,
                colspan: 6,
                renderRow: (block) => this.renderBlockRow(block),
            });
            this._blocksVirtual.mount();
        } else {
            this._blocksVirtual.setItems(blocksReversed);
        }
    }

    async renderBlockchain({ force = false } = {}) {
        const strip = document.getElementById('blockchainViz');
        const tableBody = document.getElementById('blocksTableBody');
        const blocksView = document.getElementById('view-blocks');
        const blocksViewActive = () => blocksView?.classList.contains('view--active');

        if (tableBody && !this.state.chain.length && blocksViewActive()) {
            tableBody.innerHTML = UIStates.loading({ rows: 4, cols: 6 });
        }

        return Hooks.withAsync('blocks', async () => {
            const blocks = await BlockchainAPI.getBlocksSummary();
            const fp = RenderUtils.fingerprintBlocks(blocks);
            if (!force && fp === this._fingerprints.blocks) return;
            this._fingerprints.blocks = fp;
            this.state.chain = blocks || [];

            Scheduler.schedule('blocks-dom', () => {
                if (strip) {
                    if (!this.state.chain.length) {
                        strip.innerHTML = UIStates.empty({
                            title: 'No blocks yet',
                            message: 'Mine your first block to see the chain preview.',
                            icon: '▣',
                        });
                    } else {
                        strip.innerHTML = RenderUtils.renderChainStrip(this.state.chain);
                    }
                }

                if (tableBody) {
                    if (!this.state.chain.length) {
                        this._blocksVirtual?.destroy();
                        this._blocksVirtual = null;
                        tableBody.innerHTML = UIStates.emptyCell(6, 'No blocks found — mine a block to get started');
                    } else if (blocksViewActive()) {
                        const reversed = [...this.state.chain].reverse();
                        this._mountBlocksVirtual(reversed);
                    }
                }

                if (this.state.chain.length > 0) {
                    const lastBlock = this.state.chain[this.state.chain.length - 1];
                    RenderUtils.setTextIfChanged(document.getElementById('lastBlockHash'), lastBlock.hash);
                    RenderUtils.setTextIfChanged(document.getElementById('lastBlockIndex'), lastBlock.index);
                    RenderUtils.setTextIfChanged(document.getElementById('lastBlockNonce'), lastBlock.nonce ?? 0);
                    RenderUtils.setTextIfChanged(document.getElementById('currentHash'), lastBlock.hash);
                }
            });
        }, {
            silent: true,
            onError: (err) => {
                if (tableBody) {
                    tableBody.innerHTML = UIStates.emptyCell(6, err.toDisplayString());
                }
            },
        })();
    }

    async renderWallets({ force = false } = {}) {
        const container = document.getElementById('walletsGrid');
        if (container && !this.state.wallets.length) {
            UIStates.setLoading(container, { message: 'Loading wallets…' });
        }

        return Hooks.withAsync('wallets', async () => {
            const walletsArray = await BlockchainAPI.getWallets();
            const wallets = Array.isArray(walletsArray) ? walletsArray : (walletsArray.wallets || []);
            const fp = RenderUtils.fingerprintWallets(wallets);
            if (!force && fp === this._fingerprints.wallets) return;
            this._fingerprints.wallets = fp;

            this.state.wallets = wallets;
            this._walletIndex = RenderUtils.buildWalletIndex(wallets);

            if (!container) return;

            Scheduler.schedule('wallets-dom', () => {
                if (!this.state.wallets.length) {
                    UIStates.setEmpty(container, {
                        title: 'No wallets yet',
                        message: 'Create a wallet above to start sending transactions.',
                        icon: '◈',
                    });
                } else {
                    container.innerHTML = this.state.wallets.map(wallet => `
                        <article class="wallet-card" data-address="${UIHelpers.escape(wallet.address)}">
                            <div class="wallet-card__name">${UIHelpers.escape(wallet.name || 'Wallet')}</div>
                            <div class="wallet-card__balance">${wallet.balance} <span class="text-muted" style="font-size:0.875rem">coins</span></div>
                            <code class="wallet-card__address">${UIHelpers.escape(wallet.address)}</code>
                        </article>
                    `).join('');
                    UIStates.clearBusy(container);
                }
                this.updateWalletSelectors();
            });
        }, {
            silent: true,
            onError: (err) => {
                if (container) UIStates.setError(container, { message: err.toDisplayString() });
            },
        })();
    }

    updateWalletSelectors() {
        ['senderSelect', 'receiverSelect', 'minerSelect'].forEach(id => {
            const select = document.getElementById(id);
            if (!select) return;

            const current = select.value;
            const placeholder = id === 'minerSelect' ? 'Select miner' : `Select ${id.replace('Select', '').toLowerCase()}`;
            const options = this.state.wallets.map(w =>
                `<option value="${UIHelpers.escape(w.address)}">${UIHelpers.escape(w.name || 'Wallet')} · ${w.balance} coins</option>`
            ).join('');

            select.innerHTML = `<option value="">${placeholder}</option>${options}`;
            if (current && [...select.options].some(o => o.value === current)) {
                select.value = current;
            }
        });
    }

    async renderTransactions({ force = false } = {}) {
        const container = document.getElementById('transactionList');
        const txViewActive = document.getElementById('view-transactions')?.classList.contains('view--active')
            || document.getElementById('view-overview')?.classList.contains('view--active');

        if (!txViewActive) return;

        if (container && !this.state.transactions.length) {
            container.innerHTML = UIStates.loading({ rows: 3, cols: 4 });
        }

        return Hooks.withAsync('transactions', async () => {
            const data = await BlockchainAPI.getTransactions();
            const txs = data.transactions || [];
            const fp = RenderUtils.fingerprintTransactions(txs);
            if (!force && fp === this._fingerprints.transactions) return;
            this._fingerprints.transactions = fp;
            this.state.transactions = txs;

            if (!container) return;

            Scheduler.schedule('tx-dom', () => {
                if (!this.state.transactions.length) {
                    container.innerHTML = UIStates.emptyCell(4, 'Mempool is empty — submit a transaction above');
                    return;
                }

                container.innerHTML = [...this.state.transactions].reverse().map(tx => `
                    <tr>
                        <td>${UIHelpers.escape(UIHelpers.walletLabel(tx.sender, this._walletIndex))}</td>
                        <td>${UIHelpers.escape(UIHelpers.walletLabel(tx.receiver, this._walletIndex))}</td>
                        <td><strong>${tx.amount}</strong></td>
                        <td class="text-muted">${new Date(tx.timestamp * 1000).toLocaleTimeString()}</td>
                    </tr>
                `).join('');
            });
        }, { silent: true })();
    }

    async renderMiningStats() {
        try {
            const stats = await BlockchainAPI.getStats();
            RenderUtils.setTextIfChanged(document.getElementById('currentNonce'), stats.nonce || 0);
            RenderUtils.setTextIfChanged(document.getElementById('hashAttempts'), stats.hash_attempts || 0);
            RenderUtils.setTextIfChanged(
                document.getElementById('miningTime'),
                stats.mining_time ? `${stats.mining_time}s` : '0s',
            );

            ['statsdifficulty', 'statsReward', 'totalValue'].forEach(id => {
                const el = document.getElementById(id);
                if (!el) return;
                if (id === 'statsdifficulty') RenderUtils.setTextIfChanged(el, stats.mining_difficulty ?? stats.difficulty ?? 3);
                if (id === 'statsReward') RenderUtils.setTextIfChanged(el, stats.mining_reward ?? '10.0');
                if (id === 'totalValue') RenderUtils.setTextIfChanged(el, stats.total_value ?? 0);
            });
        } catch (err) {
            Logger.debug('Mining stats update failed', err);
        }
    }

    async validateBlockchain() {
        const container = document.getElementById('validationResults');
        if (container) UIStates.setLoading(container, { message: 'Validating chain…', inline: false });

        try {
            const result = await BlockchainAPI.validateChain();

            if (container) {
                container.innerHTML = `
                    <div class="result-list">
                        <div class="result-item ${result.is_valid ? 'result-item--success' : 'result-item--error'}">
                            ${result.is_valid ? 'Chain integrity verified' : 'Chain validation failed'}
                        </div>
                        <div class="result-item">Blocks: ${result.total_blocks ?? result.chain_length ?? 0}</div>
                        <div class="result-item">Transactions: ${result.total_transactions ?? 0}</div>
                        ${result.error_message ? `<div class="result-item result-item--error">${UIHelpers.escape(result.error_message)}</div>` : ''}
                    </div>
                `;
                UIStates.clearBusy(container);
            }

            UIHelpers.setStatus(result.is_valid);
        } catch (err) {
            if (container) {
                UIStates.setError(container, {
                    title: 'Validation failed',
                    message: ErrorUtils.fromUnknown(err).toDisplayString(),
                    retryLabel: null,
                });
            }
            Toast.showError(err, { title: 'Validation' });
        }
    }

    invalidateFingerprints() {
        this._fingerprints = { stats: '', blocks: '', wallets: '', transactions: '' };
    }
}
