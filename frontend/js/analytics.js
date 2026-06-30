/* Analytics dashboard with Chart.js */

const AnalyticsDashboard = {
    charts: {},
    pollInterval: null,
    mempoolHistory: [],
    mempoolLabels: [],
    initialized: false,

    init() {
        const refreshBtn = document.getElementById('refreshAnalytics');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refresh(true));
        }

        document.addEventListener('theme-changed', () => this.rebuildCharts());
    },

    onViewActive() {
        this.refresh(false);
        if (!this.poller) {
            this.poller = Scheduler.createPoller(
                () => this.refresh(false),
                AppConfig.defaults.analyticsPollMs,
                { immediate: false },
            );
        }
        this.initialized = true;
    },

    onViewInactive() {
        this.poller?.stop();
        this.poller = null;
        Object.values(this.charts).forEach(chart => {
            try { chart.destroy(); } catch { /* noop */ }
        });
        this.charts = {};
    },

    formatUptime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) return `${h}h ${m}m`;
        if (m > 0) return `${m}m ${s}s`;
        return `${s}s`;
    },

    formatHashRate(rate) {
        if (rate >= 1_000_000) return `${(rate / 1_000_000).toFixed(1)}M H/s`;
        if (rate >= 1_000) return `${(rate / 1_000).toFixed(1)}K H/s`;
        return `${Math.round(rate)} H/s`;
    },

    getColors() {
        const s = getComputedStyle(document.documentElement);
        return {
            text: s.getPropertyValue('--text-secondary').trim() || '#a1a1aa',
            grid: s.getPropertyValue('--border').trim() || '#27272a',
            accent: s.getPropertyValue('--accent').trim() || '#3b82f6',
            success: s.getPropertyValue('--success').trim() || '#22c55e',
            warning: s.getPropertyValue('--warning').trim() || '#f59e0b',
            danger: s.getPropertyValue('--danger').trim() || '#ef4444',
            accentSoft: s.getPropertyValue('--accent-soft').trim() || 'rgba(59,130,246,0.15)',
        };
    },

    baseOptions(colors) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: colors.text,
                        usePointStyle: true,
                        padding: 16,
                        font: { family: 'Inter, sans-serif', size: 11 },
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    titleFont: { family: 'Inter, sans-serif' },
                    bodyFont: { family: 'Inter, sans-serif' },
                    padding: 10,
                    cornerRadius: 8,
                },
            },
            scales: {
                x: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text, maxRotation: 0, autoSkip: true, maxTicksLimit: 8 },
                },
                y: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text },
                    beginAtZero: true,
                },
            },
        };
    },

    destroyCharts() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
    },

    rebuildCharts() {
        if (!this.initialized || !this.lastPayload) return;
        this.destroyCharts();
        this.renderCharts(this.lastPayload);
    },

    updateKpis(summary) {
        const set = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        };

        set('kpiChainHeight', summary.chain_height);
        set('kpiTotalBlocks', summary.total_blocks);
        set('kpiBlockTime', `${summary.average_block_time}s`);
        set('kpiThroughput', `${summary.transaction_throughput} tx/block`);
        set('kpiPending', summary.pending_transactions);
        set('kpiWallets', summary.wallet_count);
        set('kpiPeers', `${summary.reachable_peers}/${summary.peer_count}`);
        set('kpiHashRate', this.formatHashRate(summary.estimated_hash_rate));
        set('kpiDifficulty', summary.difficulty);
        set('kpiRewards', `${summary.total_fees_rewards} coins`);
        set('kpiStorage', `${summary.storage_kb} KB`);
        set('kpiUptime', this.formatUptime(summary.node_uptime_seconds));

        const healthEl = document.getElementById('kpiHealth');
        if (healthEl) {
            const health = summary.network_health;
            healthEl.textContent = health.charAt(0).toUpperCase() + health.slice(1);
            healthEl.className = 'badge ' + (
                health === 'healthy' ? 'badge--success'
                    : health === 'syncing' ? 'badge--warning'
                        : 'badge--danger'
            );
        }

        const syncLabel = document.getElementById('kpiSyncLabel');
        const syncFill = document.getElementById('syncProgressFill');
        const syncBar = document.getElementById('syncProgressBar');
        const progress = summary.sync_progress_percent;

        if (syncLabel) {
            syncLabel.textContent = summary.peer_count === 0
                ? 'No peers registered'
                : `Local ${summary.total_blocks} · Longest peer ${summary.longest_peer_chain} · ${progress}%`;
        }
        if (syncFill) syncFill.style.width = `${progress}%`;
        if (syncBar) {
            syncBar.setAttribute('aria-valuenow', String(progress));
            syncBar.setAttribute('aria-label', `Network synchronization ${progress} percent`);
        }
    },

    trackMempool(pending) {
        const label = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        this.mempoolHistory.push(pending);
        this.mempoolLabels.push(label);
        if (this.mempoolHistory.length > 24) {
            this.mempoolHistory.shift();
            this.mempoolLabels.shift();
        }
    },

    renderCharts(data) {
        if (typeof Chart === 'undefined') return;

        const colors = this.getColors();
        const ts = data.timeseries;
        const labels = ts.block_labels;

        const mk = (id, config) => {
            const canvas = document.getElementById(id);
            if (!canvas) return;
            if (this.charts[id]) this.charts[id].destroy();
            this.charts[id] = new Chart(canvas, config);
        };

        mk('chartChainGrowth', {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Cumulative transactions',
                    data: ts.cumulative_txs,
                    borderColor: colors.accent,
                    backgroundColor: colors.accentSoft,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 2,
                }],
            },
            options: this.baseOptions(colors),
        });

        mk('chartBlockTime', {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Block interval (s)',
                    data: ts.block_times,
                    backgroundColor: colors.accent,
                    borderRadius: 4,
                }],
            },
            options: this.baseOptions(colors),
        });

        mk('chartThroughput', {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Transactions per block',
                    data: ts.tx_counts,
                    backgroundColor: colors.success,
                    borderRadius: 4,
                }],
            },
            options: this.baseOptions(colors),
        });

        const mempoolLabels = this.mempoolLabels.length ? this.mempoolLabels : ['Now'];
        const mempoolData = this.mempoolHistory.length ? this.mempoolHistory : [data.summary.pending_transactions];

        mk('chartMempool', {
            type: 'line',
            data: {
                labels: mempoolLabels,
                datasets: [{
                    label: 'Pending transactions',
                    data: mempoolData,
                    borderColor: colors.warning,
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    fill: true,
                    tension: 0.3,
                    pointRadius: 3,
                }],
            },
            options: this.baseOptions(colors),
        });

        mk('chartHashRate', {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Est. hash rate (H/s)',
                        data: ts.hash_rates,
                        borderColor: colors.accent,
                        yAxisID: 'y',
                        tension: 0.3,
                        pointRadius: 2,
                    },
                    {
                        label: 'Difficulty',
                        data: labels.map(() => data.summary.difficulty),
                        borderColor: colors.warning,
                        borderDash: [6, 4],
                        yAxisID: 'y1',
                        pointRadius: 0,
                    },
                ],
            },
            options: {
                ...this.baseOptions(colors),
                scales: {
                    x: this.baseOptions(colors).scales.x,
                    y: {
                        type: 'linear',
                        position: 'left',
                        grid: { color: colors.grid },
                        ticks: { color: colors.text },
                        title: { display: true, text: 'H/s', color: colors.text },
                    },
                    y1: {
                        type: 'linear',
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: { color: colors.text },
                        title: { display: true, text: 'Difficulty', color: colors.text },
                    },
                },
            },
        });

        mk('chartRewards', {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Block reward (coins)',
                    data: ts.rewards_per_block,
                    backgroundColor: colors.warning,
                    borderRadius: 4,
                }],
            },
            options: {
                ...this.baseOptions(colors),
                plugins: {
                    ...this.baseOptions(colors).plugins,
                    tooltip: {
                        ...this.baseOptions(colors).plugins.tooltip,
                        callbacks: {
                            footer: () => 'Simulator uses block rewards (no gas model)',
                        },
                    },
                },
            },
        });

        const miners = data.miners.length
            ? data.miners
            : [{ name: 'No miners yet', label: 'None', address: '', blocks_mined: 1, total_rewards: 0 }];
        const palette = [colors.accent, colors.success, colors.warning, colors.danger, '#8b5cf6', '#06b6d4'];
        const minerLabels = miners.map(m => m.name || m.label);

        mk('chartMiners', {
            type: 'doughnut',
            data: {
                labels: minerLabels,
                datasets: [{
                    label: 'Blocks mined',
                    data: miners.map(m => m.blocks_mined),
                    backgroundColor: miners.map((_, i) => palette[i % palette.length]),
                    borderWidth: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: (items) => {
                                const miner = miners[items[0]?.dataIndex];
                                return miner?.name || miner?.label || '';
                            },
                            label: (ctx) => ` ${ctx.parsed} blocks (${this.minerShare(miners, ctx.dataIndex)}%)`,
                            afterLabel: (ctx) => {
                                const miner = miners[ctx.dataIndex];
                                if (!miner) return '';
                                const lines = [`Rewards: ${miner.total_rewards} coins`];
                                if (miner.address) lines.push(miner.label || miner.address);
                                return lines;
                            },
                        },
                    },
                },
            },
        });

        this.renderMinerList(miners, palette);
    },

    minerShare(miners, index) {
        const total = miners.reduce((sum, m) => sum + (m.blocks_mined || 0), 0);
        if (!total) return '0.0';
        return ((miners[index].blocks_mined / total) * 100).toFixed(1);
    },

    /** Ranked miner list with color keys matching the doughnut chart */
    renderMinerList(miners, palette) {
        const list = document.getElementById('minerDistributionList');
        if (!list) return;

        const total = miners.reduce((sum, m) => sum + (m.blocks_mined || 0), 0);
        if (!total || (miners.length === 1 && miners[0].name === 'No miners yet')) {
            list.innerHTML = '<li class="text-muted" style="padding:var(--space-3)">Mine blocks to see miner distribution.</li>';
            return;
        }

        list.innerHTML = miners.map((miner, i) => {
            const color = palette[i % palette.length];
            const share = this.minerShare(miners, i);
            const displayName = UIHelpers.escape(miner.name || miner.label || 'Unknown');
            const addressLine = miner.address && miner.name !== miner.label
                ? `<div class="miner-legend-item__address">${UIHelpers.escape(miner.label || miner.address)}</div>`
                : '';
            const blockLabel = miner.blocks_mined === 1 ? 'block' : 'blocks';

            return `
                <li class="miner-legend-item">
                    <span class="miner-legend-item__swatch" style="background:${color}" aria-hidden="true"></span>
                    <div>
                        <div class="miner-legend-item__name">${displayName}</div>
                        ${addressLine}
                    </div>
                    <div class="miner-legend-item__stats">
                        <div class="miner-legend-item__blocks">${miner.blocks_mined} ${blockLabel}</div>
                        <div>${share}% · ${miner.total_rewards} coins</div>
                    </div>
                </li>
            `;
        }).join('');
    },

    async refresh(showToast) {
        try {
            const data = await BlockchainAPI.getAnalytics();
            this.lastPayload = data;
            this.trackMempool(data.summary.pending_transactions);
            this.updateKpis(data.summary);
            this.renderCharts(data);
            if (showToast) Toast.show('Analytics refreshed', 'success');
        } catch (err) {
            Logger.error('Analytics refresh failed:', err);
            if (showToast) Toast.show(err.message || 'Failed to load analytics', 'error');
        }
    },
};

window.AnalyticsDashboard = AnalyticsDashboard;
