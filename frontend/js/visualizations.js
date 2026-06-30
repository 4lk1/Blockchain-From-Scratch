/* Interactive blockchain visual explanations */

const Visualizations = {
    topic: 'structure',
    blocks: [],
    transactions: [],
    peers: [],
    timers: [],
    miningInterval: null,
    txStepInterval: null,
    selectedBlockIndex: 0,

    init() {
        document.querySelectorAll('[data-viz-topic]').forEach(btn => {
            btn.addEventListener('click', () => this.showTopic(btn.dataset.vizTopic));
        });

        document.getElementById('vizPlayTxLifecycle')?.addEventListener('click', () => this.playTxLifecycle());
        document.getElementById('vizTamperDemo')?.addEventListener('click', () => this.demoHashTamper());
        document.getElementById('vizResetHash')?.addEventListener('click', () => this.renderHashChaining());
        document.getElementById('vizStartMining')?.addEventListener('click', () => this.startMiningDemo());
        document.getElementById('vizStopMining')?.addEventListener('click', () => this.stopMiningDemo());
        document.getElementById('vizPlayFork')?.addEventListener('click', () => this.playForkResolution());
        document.getElementById('vizSyncPeers')?.addEventListener('click', () => this.animateSync());
    },

    clearTimers() {
        this.timers.forEach(id => clearTimeout(id));
        this.timers = [];
        this.stopMiningDemo();
        if (this.txStepInterval) clearInterval(this.txStepInterval);
    },

    onViewActive() {
        this.refresh().then(() => this.showTopic(this.topic));
    },

    onPollRefresh() {
        this.refresh().then(() => {
            const liveTopics = {
                structure: () => this.renderStructure(),
                genesis: () => this.renderGenesis(),
                linking: () => this.renderLinking(),
                merkle: () => this.renderMerkle(),
                mempool: () => this.renderMempool(),
                topology: () => this.renderTopology(),
                sync: () => this.renderSync(),
                consensus: () => this.renderConsensus(),
                fork: () => this.renderFork(),
            };
            (liveTopics[this.topic] || (() => {}))();
        });
    },

    async refresh() {
        try {
            const [blocks, txData, peerData] = await Promise.all([
                BlockchainAPI.getBlocksSummary(),
                BlockchainAPI.getTransactions(),
                BlockchainAPI.getPeers().catch(() => ({ peers: [] })),
            ]);
            this.blocks = blocks || [];
            this.transactions = txData.transactions || [];
            this.peers = peerData.peers || [];
        } catch (err) {
            Logger.error('Visualization data load failed:', err);
        }
    },

    showTopic(topic, { preserveState = false } = {}) {
        if (!preserveState) this.clearTimers();
        this.topic = topic;

        document.querySelectorAll('[data-viz-topic]').forEach(btn => {
            const active = btn.dataset.vizTopic === topic;
            btn.classList.toggle('viz-topic--active', active);
            if (active) {
                btn.setAttribute('aria-current', 'true');
            } else {
                btn.removeAttribute('aria-current');
            }
        });

        document.querySelectorAll('[data-viz-panel]').forEach(panel => {
            panel.classList.toggle('viz-panel--active', panel.dataset.vizPanel === topic);
        });

        const renderers = {
            structure: () => this.renderStructure(),
            genesis: () => this.renderGenesis(),
            linking: () => this.renderLinking(),
            hashing: () => this.renderHashChaining(),
            merkle: () => this.renderMerkle(),
            'tx-lifecycle': () => this.renderTxLifecycle(),
            signing: () => this.renderSigning(),
            consensus: () => this.renderConsensus(),
            mining: () => this.renderMining(),
            sync: () => this.renderSync(),
            topology: () => this.renderTopology(),
            fork: () => this.renderFork(),
            mempool: () => this.renderMempool(),
        };

        (renderers[topic] || renderers.structure)();
    },

    truncate(value, n = 10) {
        if (!value) return '—';
        return value.length <= n ? value : `${value.slice(0, n)}…`;
    },

    renderStructure() {
        const chainEl = document.getElementById('vizStructureChain');
        const detailEl = document.getElementById('vizStructureDetail');
        if (!chainEl) return;

        if (!this.blocks.length) {
            chainEl.innerHTML = '<p class="text-muted">Mine blocks to explore your live chain.</p>';
            return;
        }

        chainEl.innerHTML = this.blocks.map((block, i) => `
            <button type="button" class="viz-block ${i === this.selectedBlockIndex ? 'viz-block--selected' : ''} ${i === 0 ? 'viz-block--genesis' : ''}"
                data-block-index="${i}" aria-pressed="${i === this.selectedBlockIndex}"
                aria-label="Block ${block.index}, ${(block.transactions || []).length} transactions, hash ${this.truncate(block.hash, 16)}">
                <div class="viz-block__index">${i === 0 ? 'Genesis' : `Block ${block.index}`}</div>
                <div class="viz-block__hash">${this.truncate(block.hash, 14)}</div>
                <div class="text-muted" style="font-size:0.7rem">${(block.transactions || []).length} txs</div>
            </button>
        `).join('');

        chainEl.querySelectorAll('[data-block-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectedBlockIndex = parseInt(btn.dataset.blockIndex, 10);
                this.renderStructure();
            });
        });

        const block = this.blocks[this.selectedBlockIndex];
        if (detailEl && block) {
            detailEl.innerHTML = `
                <dl class="detail-list">
                    <div><dt>Index</dt><dd>${block.index}</dd></div>
                    <div><dt>Hash</dt><dd><code class="mono">${block.hash}</code></dd></div>
                    <div><dt>Previous hash</dt><dd><code class="mono">${block.previous_hash}</code></dd></div>
                    <div><dt>Nonce</dt><dd>${block.nonce ?? 0}</dd></div>
                    <div><dt>Difficulty</dt><dd>${block.difficulty ?? '—'}</dd></div>
                    <div><dt>Transactions</dt><dd>${(block.transactions || []).length}</dd></div>
                </dl>
            `;
        }
    },

    renderGenesis() {
        const el = document.getElementById('vizGenesisContent');
        if (!el) return;

        const genesis = this.blocks[0];
        if (!genesis) {
            el.innerHTML = '<p class="text-muted">No genesis block loaded yet.</p>';
            return;
        }

        el.innerHTML = `
            <div class="viz-block viz-block--genesis" style="max-width:320px;margin:0 auto var(--space-4)">
                <div class="viz-block__index">Genesis Block #0</div>
                <div class="viz-block__hash">${genesis.hash}</div>
            </div>
            <dl class="detail-list">
                <div><dt>Previous hash</dt><dd><code class="mono">"${genesis.previous_hash}"</code> — hard-coded origin</dd></div>
                <div><dt>Role</dt><dd>Anchor of the chain; all later blocks link back here</dd></div>
                <div><dt>Transactions</dt><dd>${(genesis.transactions || []).length} (often empty at creation)</dd></div>
            </dl>
        `;
    },

    renderLinking() {
        const svg = document.getElementById('vizLinkSvg');
        const labels = document.getElementById('vizLinkLabels');
        if (!svg || !this.blocks.length) return;

        const count = Math.min(this.blocks.length, 6);
        const slice = this.blocks.slice(0, count);
        const w = Math.max(600, count * 120);
        svg.setAttribute('viewBox', `0 0 ${w} 100`);

        let paths = '';
        slice.forEach((block, i) => {
            const x = 40 + i * ((w - 80) / Math.max(count - 1, 1));
            if (i > 0) {
                const prevX = 40 + (i - 1) * ((w - 80) / Math.max(count - 1, 1));
                paths += `<line class="viz-link-arrow" x1="${prevX + 30}" y1="50" x2="${x - 30}" y2="50"/>`;
            }
            paths += `<rect x="${x - 28}" y="30" width="56" height="40" rx="6" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.5"/>`;
            paths += `<text x="${x}" y="55" text-anchor="middle" fill="var(--text-secondary)" font-size="11" font-family="Inter,sans-serif">#${block.index}</text>`;
        });

        svg.innerHTML = paths;

        if (labels) {
            labels.innerHTML = slice.map((b, i) => `
                <div class="text-muted" style="font-size:0.75rem;margin-bottom:0.5rem">
                    <strong>Block #${b.index}</strong> stores previous_hash =
                    <code class="mono">${i === 0 ? '0' : this.truncate(slice[i - 1].hash, 16)}</code>
                </div>
            `).join('');
        }
    },

    renderHashChaining() {
        const container = document.getElementById('vizHashDemo');
        if (!container || this.blocks.length < 2) {
            if (container) container.innerHTML = '<p class="text-muted">Need at least 2 blocks to demo hash chaining.</p>';
            return;
        }

        const b0 = this.blocks[0];
        const b1 = this.blocks[1];

        container.innerHTML = `
            <div class="viz-hash-row" id="vizHashRow">
                <div class="viz-hash-box" id="hashBox0">
                    <div class="kpi-label">Block #${b0.index}</div>
                    <code class="mono" style="font-size:0.7rem">${this.truncate(b0.hash, 20)}</code>
                </div>
                <span class="viz-flow-arrow">→</span>
                <div class="viz-hash-box" id="hashBox1">
                    <div class="kpi-label">Block #${b1.index}</div>
                    <code class="mono" style="font-size:0.7rem">${this.truncate(b1.hash, 20)}</code>
                    <div class="text-muted" style="font-size:0.65rem;margin-top:0.25rem">links to prev</div>
                </div>
                <span class="viz-flow-arrow">→</span>
                <div class="viz-hash-box" id="hashBox2">
                    <div class="kpi-label">Block #${(this.blocks[2] || b1).index}</div>
                    <code class="mono" style="font-size:0.7rem">${this.truncate((this.blocks[2] || b1).hash, 20)}</code>
                </div>
            </div>
            <p class="text-muted" style="font-size:0.8125rem">Tampering with Block #${b1.index} breaks the chain link — subsequent validation fails.</p>
        `;
    },

    demoHashTamper() {
        const box1 = document.getElementById('hashBox1');
        const box2 = document.getElementById('hashBox2');
        if (!box1 || !box2) return;

        box1.classList.add('viz-hash-box--invalid');
        box1.querySelector('.mono').textContent = this.truncate('tampered' + Math.random().toString(16).slice(2), 20);

        this.timers.push(setTimeout(() => {
            box2.classList.add('viz-hash-box--invalid');
        }, 400));
    },

    async sha256(text) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async buildMerkleLevels(txHashes) {
        if (!txHashes.length) return [[{ label: 'empty', leaf: true }]];

        let level = txHashes.map(h => ({ label: this.truncate(h, 8), leaf: true, full: h }));
        const levels = [level];

        while (level.length > 1) {
            const next = [];
            for (let i = 0; i < level.length; i += 2) {
                const left = level[i].full || level[i].label;
                const right = (level[i + 1]?.full || level[i + 1]?.label) || left;
                const combined = await this.sha256(left + right);
                next.push({ label: this.truncate(combined, 8), full: combined });
            }
            level = next;
            levels.push(level);
        }
        return levels;
    },

    async renderMerkle() {
        const el = document.getElementById('vizMerkleTree');
        if (!el) return;

        const summary = this.blocks[this.selectedBlockIndex] || this.blocks[this.blocks.length - 1];
        if (!summary) {
            el.innerHTML = '<p class="text-muted">No blocks available.</p>';
            return;
        }

        let block = summary;
        if (!block.transactions?.length) {
            try {
                block = await BlockchainAPI.getBlock(summary.index);
            } catch {
                /* use summary only */
            }
        }

        const txs = block.transactions || [];
        if (!txs.length) {
            el.innerHTML = '<p class="text-muted">No transactions in this block.</p>';
            return;
        }

        const txHashes = txs.map((tx, i) => `${tx.sender}|${tx.receiver}|${tx.amount}|${i}`);
        const hashed = await Promise.all(txHashes.map(t => this.sha256(t)));
        const levels = await this.buildMerkleLevels(hashed);

        el.innerHTML = levels.reverse().map((level, li) => `
            <div class="viz-merkle-level">
                ${level.map(node => `
                    <div class="viz-merkle-node ${node.leaf ? 'viz-merkle-node--leaf' : ''} ${li === 0 ? 'viz-merkle-node--root' : ''}">
                        ${node.label}
                    </div>
                `).join('')}
            </div>
        `).join('');
    },

    renderTxLifecycle() {
        const steps = document.querySelectorAll('#vizTxSteps .viz-step');
        steps.forEach((s, i) => {
            s.classList.remove('viz-step--active', 'viz-step--done');
            if (i === 0) s.classList.add('viz-step--active');
        });
    },

    playTxLifecycle() {
        const steps = document.querySelectorAll('#vizTxSteps .viz-step');
        let current = 0;

        if (this.txStepInterval) clearInterval(this.txStepInterval);

        this.txStepInterval = setInterval(() => {
            steps.forEach((s, i) => {
                s.classList.toggle('viz-step--active', i === current);
                s.classList.toggle('viz-step--done', i < current);
            });
            current += 1;
            if (current >= steps.length) {
                clearInterval(this.txStepInterval);
                steps.forEach(s => s.classList.add('viz-step--done'));
            }
        }, 900);
    },

    renderSigning() {
        /* Static diagram — HTML in index */
    },

    renderConsensus() {
        const el = document.getElementById('vizConsensusState');
        if (!el) return;
        const valid = this.blocks.length > 0;
        el.textContent = valid
            ? 'Longest valid chain with valid PoW is accepted as canonical state.'
            : 'Waiting for chain data…';
    },

    renderMining() {
        this.stopMiningDemo();
        const nonceEl = document.getElementById('vizMiningNonce');
        const hashEl = document.getElementById('vizMiningHash');
        if (nonceEl) nonceEl.textContent = '0';
        if (hashEl) {
            hashEl.textContent = '0000000000000000000000000000000000000000000000000000000000000000';
            hashEl.classList.remove('viz-mining-hash--valid');
        }
    },

    startMiningDemo() {
        this.stopMiningDemo();
        const difficulty = 3;
        const nonceEl = document.getElementById('vizMiningNonce');
        const hashEl = document.getElementById('vizMiningHash');
        let nonce = 0;

        const tick = async () => {
            nonce += 1;
            const payload = `block-demo|${nonce}|${Date.now()}`;
            const hash = await this.sha256(payload);
            if (nonceEl) nonceEl.textContent = nonce.toLocaleString();
            if (hashEl) {
                hashEl.textContent = hash;
                if (hash.startsWith('0'.repeat(difficulty))) {
                    hashEl.classList.add('viz-mining-hash--valid');
                    this.stopMiningDemo();
                    Toast.show(`Valid hash found at nonce ${nonce}`, 'success');
                } else {
                    hashEl.classList.remove('viz-mining-hash--valid');
                }
            }
        };

        this.miningInterval = setInterval(tick, 40);
        tick();
    },

    stopMiningDemo() {
        if (this.miningInterval) {
            clearInterval(this.miningInterval);
            this.miningInterval = null;
        }
    },

    renderSync() {
        const el = document.getElementById('vizSyncStatus');
        if (el) {
            el.textContent = this.peers.length
                ? `${this.peers.length} peer(s) registered — click Sync to pull longest chain.`
                : 'Register peers via API to enable synchronization demo.';
        }
    },

    async animateSync() {
        const el = document.getElementById('vizSyncAnimation');
        if (!el) return;

        el.innerHTML = '<div class="viz-flow-node viz-pulse">Fetching /blocks…</div>';
        try {
            const result = await BlockchainAPI.syncNetwork();
            el.innerHTML = `
                <div class="result-list">
                    <div class="result-item ${result.success ? 'result-item--success' : ''}">
                        ${result.message}
                    </div>
                    <div class="result-item">Local length: ${result.local_chain_length}</div>
                </div>
            `;
            await this.refresh();
            Toast.show('Sync complete', result.success ? 'success' : 'info');
        } catch (err) {
            el.innerHTML = `<p class="text-muted">${err.message}</p>`;
        }
    },

    renderTopology() {
        const orbit = document.getElementById('vizNetworkOrbit');
        if (!orbit) return;

        const peers = this.peers.length ? this.peers : ['peer-a.local', 'peer-b.local'];
        orbit.innerHTML = '';

        peers.slice(0, 6).forEach((peer, i) => {
            const angle = (i / peers.length) * Math.PI * 2 - Math.PI / 2;
            const radius = 120;
            const x = 50 + Math.cos(angle) * 38;
            const y = 50 + Math.sin(angle) * 38;
            const node = document.createElement('div');
            node.className = 'viz-node';
            node.style.left = `calc(${x}% - 32px)`;
            node.style.top = `calc(${y}% - 32px)`;
            node.style.animationDelay = `${i * 0.3}s`;
            node.textContent = this.truncate(peer.replace(/^https?:\/\//, ''), 8);
            node.title = peer;
            orbit.appendChild(node);
        });
    },

    renderFork() {
        const honest = document.getElementById('vizForkHonest');
        const alt = document.getElementById('vizForkAlt');
        const len = this.blocks.length || 4;
        if (honest) honest.innerHTML = Array(len).fill('<span class="viz-fork-block"></span>').join('');
        if (alt) alt.innerHTML = Array(len + 2).fill('<span class="viz-fork-block"></span>').join('');
    },

    playForkResolution() {
        const honest = document.getElementById('vizForkHonest')?.closest('.viz-fork-chain');
        const alt = document.getElementById('vizForkAlt')?.closest('.viz-fork-chain');
        if (!honest || !alt) return;

        honest.classList.add('viz-fork-chain--winner');
        alt.classList.remove('viz-fork-chain--winner');

        this.timers.push(setTimeout(() => {
            honest.classList.remove('viz-fork-chain--winner');
            alt.classList.add('viz-fork-chain--winner');
            Toast.show('Attacker chain is longer — network switches (longest valid chain rule)', 'info');
        }, 1200));
    },

    renderMempool() {
        const pool = document.getElementById('vizMempoolPool');
        const count = document.getElementById('vizMempoolCount');
        if (!pool) return;

        if (!this.transactions.length) {
            pool.innerHTML = '<span class="text-muted">Mempool empty — create a transaction to see it here.</span>';
        } else {
            pool.innerHTML = this.transactions.map((tx, i) => `
                <div class="viz-mempool-tx" style="animation-delay:${i * 80}ms">
                    ${this.truncate(tx.sender, 6)} → ${this.truncate(tx.receiver, 6)} · ${tx.amount}
                </div>
            `).join('');
        }
        if (count) count.textContent = this.transactions.length;
    },
};

window.Visualizations = Visualizations;
