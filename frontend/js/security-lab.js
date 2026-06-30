/* Security Lab — threat catalog, step simulations, live API demos */

const LAB_CATEGORIES = [
    {
        id: 'integrity',
        label: 'Integrity',
        topics: ['tamper-detection', 'hash-collision', 'nonce-manipulation'],
    },
    {
        id: 'transactions',
        label: 'Transactions',
        topics: ['invalid-signatures', 'replay-attack', 'double-spend'],
    },
    {
        id: 'consensus',
        label: 'Consensus',
        topics: ['fifty-one-percent', 'selfish-mining', 'timestamp-manipulation'],
    },
    {
        id: 'network',
        label: 'Network',
        topics: ['sybil-attack', 'eclipse-attack'],
    },
];

/** @type {Record<string, object>} */
const LAB_TOPICS = {
    'tamper-detection': {
        title: 'Block tampering',
        category: 'integrity',
        severity: 'critical',
        purpose: 'Show how changing historical data breaks hash integrity and chain validation.',
        overview: 'An attacker modifies a confirmed transaction amount inside an old block. The block hash no longer matches its contents, and every subsequent link becomes invalid.',
        threatModel: 'Insider with disk access, compromised node storage, or malware altering chain files offline.',
        affected: ['Block headers', 'Hash chain', 'Full chain validation'],
        mitigation: 'Distributed replication, checksum audits, consensus re-validation on sync, immutable storage.',
        realWorld: '2010 Bitcoin value overflow incident; exchange hot-wallet DB tampering (centralized systems).',
        bestPractices: [
            'Run validation after restore from backup.',
            'Compare local chain hash against peer responses.',
            'Treat single-node storage as untrusted for history.',
        ],
        learnTopic: 'immutability',
        simType: 'live-api',
    },
    'hash-collision': {
        title: 'Hash collisions',
        category: 'integrity',
        severity: 'medium',
        purpose: 'Explain why SHA-256 collision resistance protects block and transaction IDs.',
        overview: 'A collision would let two different payloads share the same hash. SHA-256 has no known practical collisions — attackers cannot forge equivalent payloads.',
        threatModel: 'Theoretical cryptanalytic breakthrough; legacy algorithms (MD5) were vulnerable in other domains.',
        affected: ['Block hashes', 'Transaction IDs', 'Merkle roots'],
        mitigation: 'Use modern hashes (SHA-256+), monitor crypto research, upgrade before weakness emerges.',
        realWorld: 'MD5 certificate collisions (2008); Bitcoin uses SHA-256 specifically to avoid this class.',
        bestPractices: [
            'Never substitute MD5/SHA-1 for blockchain identifiers.',
            'Include full transaction fields in signed payload.',
        ],
        learnTopic: 'hashing',
        simType: 'interactive',
    },
    'nonce-manipulation': {
        title: 'Nonce manipulation',
        category: 'integrity',
        severity: 'medium',
        purpose: 'Demonstrate that PoW requires a valid nonce — arbitrary values fail validation.',
        overview: 'Miners search for a nonce producing a hash below the difficulty target. Setting a random nonce without work fails proof-of-work checks.',
        threatModel: 'Attacker submits blocks with invalid PoW hoping nodes skip verification.',
        affected: ['Proof-of-work validation', 'Block acceptance', 'Mining difficulty'],
        mitigation: 'Mandatory PoW verification on every block; reject blocks instantly on failure.',
        realWorld: 'CVE-class bugs in lightweight clients that skipped PoW checks have caused consensus splits.',
        bestPractices: [
            'Always verify leading-zero prefix against difficulty.',
            'Never trust block headers without recalculating hash.',
        ],
        learnTopic: 'mining',
        simType: 'animated',
    },
    'invalid-signatures': {
        title: 'Invalid signatures',
        category: 'transactions',
        severity: 'high',
        purpose: 'Show that ECDSA verification rejects forged or altered transaction payloads.',
        overview: 'Each transfer is signed over a hash of sender, receiver, amount, and timestamp. Changing any field invalidates the signature.',
        threatModel: 'Attacker replays or edits unsigned/malformed transactions; stolen keys sign unauthorized spends.',
        affected: ['Mempool admission', 'Transaction validation', 'Balance checks'],
        mitigation: 'Verify signature + public key → address mapping before accepting txs.',
        realWorld: 'Exchange API keys signing withdrawals; Bitcoin OP_CHECKSIG failures reject invalid scripts.',
        bestPractices: [
            'Reject unsigned user transactions at the mempool.',
            'Bind public key to sender address explicitly.',
        ],
        learnTopic: 'signatures',
        simType: 'interactive',
    },
    'replay-attack': {
        title: 'Replay attacks',
        category: 'transactions',
        severity: 'medium',
        purpose: 'Explain duplicate transaction submission and how deduplication prevents double inclusion.',
        overview: 'An attacker rebroadcasts a valid signed transaction to spend twice. This simulator deduplicates by transaction ID (payload hash) in the mempool.',
        threatModel: 'Network eavesdropper captures signed tx and rebroadcasts before confirmation.',
        affected: ['Mempool', 'Transaction ID deduplication', 'Balance reservation'],
        mitigation: 'Unique tx IDs, account nonces (not in this simulator), UTXO model, confirmation depth.',
        realWorld: 'Ethereum chain-ID + nonce prevents cross-chain replay; Bitcoin UTXO prevents exact replay.',
        bestPractices: [
            'Track seen transaction IDs per node.',
            'Wait for confirmations on high-value transfers.',
        ],
        learnTopic: 'mempool',
        simType: 'animated',
    },
    'double-spend': {
        title: 'Double spending',
        category: 'transactions',
        severity: 'critical',
        purpose: 'Visualize spending the same coins on two branches before confirmation.',
        overview: 'Victim accepts payment on chain A while attacker spends same coins on private chain B. Longest valid chain eventually wins — merchant may lose funds.',
        threatModel: 'Attacker with hash power or fast relay to merchant; 0-confirmation acceptance.',
        affected: ['Consensus', 'Confirmations', 'Merchant settlement'],
        mitigation: 'Wait for confirmations; monitor for competing chains; use longest-chain rule.',
        realWorld: 'Bitcoin Gold 51% incidents; RBF policy debates on unconfirmed txs.',
        bestPractices: [
            'Require N confirmations for settlement.',
            'Use payment processors with chain monitoring.',
        ],
        learnTopic: 'forks',
        simType: 'animated',
    },
    'fifty-one-percent': {
        title: '51% attack',
        category: 'consensus',
        severity: 'critical',
        purpose: 'Simulate majority hash power building a longer private chain to rewrite history.',
        overview: 'Attacker mines privately, publishes a longer valid chain, and nodes reorg — reversing recent transactions (double-spend).',
        threatModel: 'Mining pool collusion, rented hash power, nation-state resources on small chains.',
        affected: ['Chain tip', 'Confirmations', 'Mining economics'],
        mitigation: 'High hash rate diversity, checkpointing, confirmation depth, monitoring reorgs.',
        realWorld: 'Ethereum Classic 51% attacks (2019–2020); Bitcoin has never sustained a successful 51% rewrite.',
        bestPractices: [
            'Monitor chain reorg depth on exchanges.',
            'Increase confirmations on low-hashrate assets.',
        ],
        learnTopic: 'forks',
        simType: 'live-api',
    },
    'selfish-mining': {
        title: 'Selfish mining',
        category: 'consensus',
        severity: 'high',
        purpose: 'Illustrate withholding blocks to gain disproportionate rewards vs honest miners.',
        overview: 'A miner finds a valid block but keeps it private, continuing to mine on their hidden tip. When honest miners catch up, the selfish miner releases blocks strategically.',
        threatModel: 'Pool with >33% hash rate implementing private chain strategy.',
        affected: ['Block propagation', 'Mining rewards', 'Network fairness'],
        mitigation: 'Random propagation delays detection; penalty forks (research); diverse mining pools.',
        realWorld: 'Eyal & Sirer 2013 paper; debated relevance at Bitcoin scale with fast propagation.',
        bestPractices: [
            'Monitor orphan rates and propagation latency.',
            'Encourage open pool policies.',
        ],
        learnTopic: 'consensus',
        simType: 'animated',
    },
    'timestamp-manipulation': {
        title: 'Timestamp manipulation',
        category: 'consensus',
        severity: 'low',
        purpose: 'Show how skewed block timestamps affect ordering and difficulty heuristics.',
        overview: 'Miners can choose timestamps within protocol rules. Extreme manipulation can affect retargeting or transaction locktimes in full clients.',
        threatModel: 'Miner sets far-future timestamps to influence difficulty or ordering.',
        affected: ['Block metadata', 'Difficulty adjustment (future)', 'Transaction locktime'],
        mitigation: 'Median-time-past rules (Bitcoin); reject blocks outside allowed drift.',
        realWorld: 'Bitcoin MedianTimePast limits timestamp games; some altcoins had time-warp bugs.',
        bestPractices: [
            'Validate timestamp against network median.',
            'Do not rely on block time for legal deadlines.',
        ],
        learnTopic: 'blocks',
        simType: 'animated',
    },
    'sybil-attack': {
        title: 'Sybil attack',
        category: 'network',
        severity: 'high',
        purpose: 'Demonstrate flooding the peer list with fake identities to influence routing.',
        overview: 'One adversary controls many fake node IDs, appearing as majority of the network. Can bias sync sources or eclipse victims.',
        threatModel: 'Cheap identity creation (no stake); attacker spins up thousands of HTTP endpoints.',
        affected: ['Peer registry', 'Sync source selection', 'Network graph'],
        mitigation: 'Proof-of-stake peer scoring, hardcoded seeds, connection limits, stake-based identity.',
        realWorld: 'Tor sybil research; Ethereum discv5 ENR records with reputation layers.',
        bestPractices: [
            'Whitelist known bootstrap peers.',
            'Limit peers per IP / ASN.',
        ],
        learnTopic: 'network',
        simType: 'animated',
    },
    'eclipse-attack': {
        title: 'Eclipse attack',
        category: 'network',
        severity: 'high',
        purpose: 'Show isolating a victim node so they only see attacker-controlled data.',
        overview: 'Attacker occupies all victim peer slots with malicious nodes. Victim syncs to a fake chain or misses real transactions.',
        threatModel: 'Network-level adversary; BGP hijack; sybil peers targeting one node.',
        affected: ['Peer connections', 'Chain sync', 'Transaction relay'],
        mitigation: 'Diverse outbound connections, anchor channels, peer rotation, multi-source sync.',
        realWorld: 'Heilman et al. 2015 Bitcoin eclipse paper; mitigations added to Bitcoin Core.',
        bestPractices: [
            'Maintain diverse peer geography.',
            'Compare chains from multiple sources.',
        ],
        learnTopic: 'network',
        simType: 'animated',
    },
};

const SecurityLab = {
    topic: 'tamper-detection',
    timers: [],
    stepInterval: null,

    init() {
        this.renderTopicNav();
        document.getElementById('labResetBtn')?.addEventListener('click', () => this.runReset());
    },

    onViewActive(topicId) {
        const id = topicId && LAB_TOPICS[topicId] ? topicId : this.topic;
        this.showTopic(id);
    },

    clearTimers() {
        this.timers.forEach(id => clearTimeout(id));
        this.timers = [];
        if (this.stepInterval) {
            clearInterval(this.stepInterval);
            this.stepInterval = null;
        }
    },

    escape(text) {
        return UIHelpers.escape(String(text ?? ''));
    },

    severityLabel(severity) {
        const labels = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };
        return labels[severity] || severity;
    },

    renderTopicNav() {
        const nav = document.getElementById('labTopicList');
        if (!nav) return;

        nav.innerHTML = LAB_CATEGORIES.map(group => `
            <div class="lab-topic-group">
                <p class="lab-topic-group__label">${this.escape(group.label)}</p>
                ${group.topics.map(id => {
                    const t = LAB_TOPICS[id];
                    return `
                        <button type="button" class="lab-topic ${id === this.topic ? 'lab-topic--active' : ''}"
                            data-lab-topic="${id}" aria-current="${id === this.topic ? 'true' : 'false'}">
                            <span class="lab-topic__severity lab-severity--${t.severity}" aria-hidden="true"></span>
                            <span>${this.escape(t.title)}</span>
                        </button>
                    `;
                }).join('')}
            </div>
        `).join('');

        nav.querySelectorAll('[data-lab-topic]').forEach(btn => {
            btn.addEventListener('click', () => {
                NavManager.show(`lab/${btn.dataset.labTopic}`);
            });
        });
    },

    showTopic(topicId) {
        const topic = LAB_TOPICS[topicId] || LAB_TOPICS[this.topic];
        if (!topic) return;

        this.clearTimers();
        this.topic = topicId in LAB_TOPICS ? topicId : 'tamper-detection';

        document.querySelectorAll('[data-lab-topic]').forEach(btn => {
            const active = btn.dataset.labTopic === this.topic;
            btn.classList.toggle('lab-topic--active', active);
            btn.setAttribute('aria-current', active ? 'true' : 'false');
        });

        const stage = document.getElementById('labStage');
        if (!stage) return;

        stage.innerHTML = this.renderTopicPanel(LAB_TOPICS[this.topic]);
        this.bindPanelActions(stage);
    },

    renderTopicPanel(t) {
        const learnLink = t.learnTopic
            ? `<a href="#learn/${t.learnTopic}" class="edu-learn-link" data-learn-topic="${t.learnTopic}">Learn more →</a>`
            : '';

        return `
            <article class="card lab-panel">
                <div class="card__header">
                    <h2 class="card__title">${this.escape(t.title)}</h2>
                    ${learnLink}
                </div>
                <div class="card__body">
                    <div class="lab-header-meta">
                        <span class="lab-badge lab-badge--${t.severity}">${this.escape(this.severityLabel(t.severity))} risk</span>
                        <span class="lab-badge lab-badge--category">${this.escape(t.category)}</span>
                        <span class="lab-badge lab-badge--category">${t.simType === 'live-api' ? 'Live API demo' : 'Interactive simulation'}</span>
                    </div>

                    <p class="page-desc" style="margin-bottom:var(--space-5)">${this.escape(t.purpose)}</p>

                    <div class="lab-info-grid">
                        ${this.infoCard('Attack overview', t.overview)}
                        ${this.infoCard('Threat model', t.threatModel)}
                        ${this.infoCard('Affected components', `<ul>${t.affected.map(c => `<li>${this.escape(c)}</li>`).join('')}</ul>`)}
                        ${this.infoCard('Mitigation', t.mitigation)}
                        ${this.infoCard('Real-world context', t.realWorld)}
                    </div>

                    <div class="lab-sim">
                        <h3 class="lab-sim__title">Interactive simulation</h3>
                        <p class="lab-sim__desc">Step through the attack. ${t.simType === 'live-api' ? 'This demo calls your local API — your live chain is not permanently modified.' : 'This is a client-side educational animation.'}</p>
                        <div class="lab-sim-stage" id="labSimStage" aria-live="polite">
                            <div id="labSimContent"></div>
                            <div id="labSimProgress"></div>
                        </div>
                        <div class="lab-sim-controls" id="labSimControls"></div>
                    </div>

                    <div class="lab-practices">
                        <p class="lab-practices__title">Best practices</p>
                        <ul>${t.bestPractices.map(p => `<li>${this.escape(p)}</li>`).join('')}</ul>
                    </div>
                </div>
            </article>
        `;
    },

    infoCard(title, body) {
        return `
            <div class="lab-info-card">
                <h4 class="lab-info-card__title">${this.escape(title)}</h4>
                <div class="lab-info-card__body">${typeof body === 'string' && body.startsWith('<') ? body : `<p>${this.escape(body)}</p>`}</div>
            </div>
        `;
    },

    bindPanelActions(stage) {
        const controls = stage.querySelector('#labSimControls');
        const simContent = stage.querySelector('#labSimContent');
        const simProgress = stage.querySelector('#labSimProgress');
        if (!controls || !simContent) return;

        if (simProgress) simProgress.innerHTML = '';

        const runners = {
            'tamper-detection': () => this.renderTamperControls(controls, simContent, simProgress),
            'fifty-one-percent': () => this.render51Controls(controls, simContent, simProgress),
            'hash-collision': () => this.renderHashCollisionControls(controls, simContent),
            'invalid-signatures': () => this.renderSignatureControls(controls, simContent),
            'replay-attack': () => this.renderReplayControls(controls, simProgress),
            'double-spend': () => this.renderDoubleSpendControls(controls, simContent, simProgress),
            'nonce-manipulation': () => this.renderNonceControls(controls, simContent, simProgress),
            'timestamp-manipulation': () => this.renderTimestampControls(controls, simProgress),
            'selfish-mining': () => this.renderSelfishMiningControls(controls, simContent, simProgress),
            'sybil-attack': () => this.renderSybilControls(controls, simContent, simProgress),
            'eclipse-attack': () => this.renderEclipseControls(controls, simContent, simProgress),
        };

        (runners[this.topic] || (() => {
            simContent.innerHTML = '<p class="text-muted">Simulation loading…</p>';
        }))();
    },

    renderSteps(container, steps) {
        if (!container) return;
        container.innerHTML = `
            <div class="lab-steps" id="labSteps">
                ${steps.map((text, i) => `
                    <div class="lab-step" data-step="${i}">
                        <span class="lab-step__num">${i + 1}</span>
                        <span>${this.escape(text)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    },

    activateStep(index) {
        document.querySelectorAll('#labSimProgress .lab-step, #labSteps .lab-step').forEach((el, i) => {
            el.classList.toggle('lab-step--active', i === index);
            el.classList.toggle('lab-step--done', i < index);
        });
    },

    async playSteps(steps, onStep, progressEl) {
        this.clearTimers();
        const target = progressEl || document.getElementById('labSimProgress');
        if (target && !target.querySelector('#labSteps')) {
            this.renderSteps(target, steps);
        }
        for (let i = 0; i < steps.length; i += 1) {
            this.activateStep(i);
            if (onStep) await onStep(i);
            await new Promise(resolve => {
                this.timers.push(setTimeout(resolve, 900));
            });
        }
        document.querySelectorAll('#labSimProgress .lab-step, #labSteps .lab-step').forEach(s => s.classList.add('lab-step--done'));
    },

    async sha256(text) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    /* ── Live API: tamper ── */
    renderTamperControls(controls, simContent, simProgress) {
        simContent.innerHTML = `
            <div class="field-row">
                <div class="field"><label for="labTamperBlock">Block index</label><input type="number" id="labTamperBlock" class="input" min="0" value="1"></div>
                <div class="field"><label for="labTamperTx">Tx index</label><input type="number" id="labTamperTx" class="input" min="0" value="0"></div>
                <div class="field"><label for="labTamperAmount">New amount</label><input type="number" id="labTamperAmount" class="input" value="999"></div>
            </div>
        `;
        controls.innerHTML = `
            <button type="button" class="btn btn--warning btn--sm" id="labRunTamper">Run tamper demo</button>
        `;
        controls.querySelector('#labRunTamper')?.addEventListener('click', () => this.runTamperDemo(simContent, simProgress));
    },

    async runTamperDemo(simContent, simProgress) {
        const blockIdx = parseInt(document.getElementById('labTamperBlock')?.value, 10);
        const txIdx = parseInt(document.getElementById('labTamperTx')?.value, 10);
        const amount = parseFloat(document.getElementById('labTamperAmount')?.value);

        if (Number.isNaN(blockIdx) || Number.isNaN(txIdx) || Number.isNaN(amount)) {
            Toast.show('Enter valid tamper parameters', 'error');
            return;
        }

        const steps = [
            'Load block and transaction from local chain',
            'Simulate altering transaction amount in memory',
            'Recalculate block hash with tampered data',
            'Run full chain validation',
            'Restore original state (demo only)',
        ];
        if (simProgress) simProgress.innerHTML = '';

        try {
            await this.playSteps(steps, async (i) => {
                if (i === 3) {
                    const result = await BlockchainAPI.tamperBlock({
                        block_index: blockIdx,
                        transaction_index: txIdx,
                        new_amount: amount,
                    });
                    const valid = result.chain_valid;
                    if (simProgress) {
                        simProgress.insertAdjacentHTML('beforeend', `
                            <div class="result-list" style="margin-top:var(--space-4)">
                                <div class="result-item ${valid ? 'result-item--success' : 'result-item--error'}">
                                    ${valid ? 'Unexpected: chain still valid' : 'Tampering detected — chain invalid ✕'}
                                </div>
                                <div class="result-item">Amount: ${result.before?.amount} → ${result.after?.amount}</div>
                                <div class="result-item">Hash prefix: ${this.escape(result.before?.hash)} → ${this.escape(result.after?.hash)}</div>
                            </div>
                        `);
                    }
                    window.uiRenderer?.invalidateFingerprints();
                    await window.uiRenderer?.validateBlockchain();
                }
            }, simProgress);
            Toast.show('Tamper demo complete', 'info');
        } catch (err) {
            ErrorUtils.notify(err, { title: 'Tamper demo' });
        }
    },

    /* ── Live API: 51% ── */
    render51Controls(controls, simContent, simProgress) {
        simContent.innerHTML = `
            <div class="lab-fork-viz">
                <div class="lab-fork-lane" id="labHonestLane">
                    <span class="lab-fork-label">Honest chain</span>
                    <div class="lab-fork-blocks" id="labHonestBlocks"></div>
                </div>
                <div class="lab-fork-lane lab-fork-lane--danger" id="labAttackerLane">
                    <span class="lab-fork-label">Attacker private chain</span>
                    <div class="lab-fork-blocks" id="labAttackerBlocks"></div>
                </div>
            </div>
        `;
        controls.innerHTML = `
            <button type="button" class="btn btn--warning btn--sm" id="labRun51">Simulate 51% attack</button>
        `;
        controls.querySelector('#labRun51')?.addEventListener('click', () => this.run51Attack(simContent, simProgress));
    },

    async run51Attack(simContent, simProgress) {
        const steps = [
            'Seed honest chain — victim pays attacker',
            'Attacker mines on public chain (shorter branch)',
            'Attacker builds longer private chain in secret',
            'Attacker publishes private chain',
            'Network follows longest valid chain (reorg)',
        ];
        if (simProgress) simProgress.innerHTML = '';

        try {
            await this.playSteps(steps, async (i) => {
                if (i === 4) {
                    const result = await BlockchainAPI.perform51Attack();
                    const honest = simContent.querySelector('#labHonestBlocks');
                    const attacker = simContent.querySelector('#labAttackerBlocks');
                    if (honest) honest.innerHTML = Array(result.public_chain_length || 0).fill('<span class="lab-fork-block"></span>').join('');
                    if (attacker) attacker.innerHTML = Array(result.attacker_chain_length || 0).fill('<span class="lab-fork-block"></span>').join('');

                    const winner = result.success ? 'labAttackerLane' : 'labHonestLane';
                    simContent.querySelector('#labHonestLane')?.classList.toggle('lab-fork-lane--winner', winner === 'labHonestLane');
                    simContent.querySelector('#labAttackerLane')?.classList.toggle('lab-fork-lane--winner', winner === 'labAttackerLane');

                    if (simProgress) {
                        simProgress.insertAdjacentHTML('beforeend', `
                            <div class="result-list" style="margin-top:var(--space-4)">
                                <div class="result-item ${result.success ? 'result-item--error' : 'result-item--success'}">
                                    ${result.success ? 'Attack succeeded — longer chain wins' : 'Attack failed — honest chain retained'}
                                </div>
                                <div class="result-item">Honest length: ${result.public_chain_length} · Attacker: ${result.attacker_chain_length}</div>
                                <div class="result-item">Double-spend amount: ${result.double_spend_amount} coins</div>
                                <div class="result-item">Victim balance: ${result.initial_victim_balance} → ${result.final_victim_balance}</div>
                            </div>
                        `);
                    }
                    Toast.show(result.success ? '51% attack succeeded (simulated)' : 'Network defended attack', result.success ? 'error' : 'success');
                }
            }, simProgress);
        } catch (err) {
            ErrorUtils.notify(err, { title: '51% attack' });
        }
    },

    /* ── Interactive: hash collision ── */
    renderHashCollisionControls(controls, simContent) {
        simContent.innerHTML = `
            <div class="field"><label for="labHashA">Input A</label><input id="labHashA" class="input" value="Block #42: Alice → Bob 10"></div>
            <div class="field" style="margin-top:var(--space-3)"><label for="labHashB">Input B</label><input id="labHashB" class="input" value="Block #42: Alice → Bob 999"></div>
            <div id="labHashOut" class="text-muted" style="margin-top:var(--space-3);font-size:0.8125rem"></div>
        `;
        controls.innerHTML = `<button type="button" class="btn btn--primary btn--sm" id="labRunHash">Compare hashes</button>`;
        controls.querySelector('#labRunHash')?.addEventListener('click', async () => {
            const a = document.getElementById('labHashA')?.value || '';
            const b = document.getElementById('labHashB')?.value || '';
            const [ha, hb] = await Promise.all([this.sha256(a), this.sha256(b)]);
            const out = simContent.querySelector('#labHashOut');
            if (out) {
                out.innerHTML = `
                    <p><strong>A:</strong> <code class="mono">${ha.slice(0, 32)}…</code></p>
                    <p><strong>B:</strong> <code class="mono">${hb.slice(0, 32)}…</code></p>
                    <p style="color:var(--success);margin-top:0.5rem">Different inputs → different hashes. Finding a collision for SHA-256 is infeasible.</p>
                `;
            }
        });
    },

    /* ── Interactive: signatures ── */
    renderSignatureControls(controls, simContent) {
        simContent.innerHTML = `
            <div class="field"><label for="labSignMsg">Transaction payload</label><input id="labSignMsg" class="input" value="alice→bob:10.00"></div>
            <div id="labSignOut" class="text-muted" style="margin-top:var(--space-3);font-size:0.8125rem"></div>
        `;
        controls.innerHTML = `<button type="button" class="btn btn--primary btn--sm" id="labRunSign">Simulate verify</button>`;
        controls.querySelector('#labRunSign')?.addEventListener('click', async () => {
            const msg = document.getElementById('labSignMsg')?.value || '';
            const tampered = msg.replace(/\d+(\.\d+)?/, '999');
            const [h1, h2] = await Promise.all([this.sha256(msg), this.sha256(tampered)]);
            const out = simContent.querySelector('#labSignOut');
            if (out) {
                out.innerHTML = `
                    <p>Signed payload hash: <code class="mono">${h1.slice(0, 24)}…</code></p>
                    <p>After tamper "${this.escape(tampered)}": <code class="mono">${h2.slice(0, 24)}…</code></p>
                    <p style="color:var(--danger)">ECDSA verification fails — transaction rejected.</p>
                `;
            }
        });
    },

    /* ── Animated: replay ── */
    renderReplayControls(controls, simProgress) {
        const steps = [
            'Alice signs transfer to Bob (tx ID = hash of payload)',
            'Transaction enters mempool — balance reserved',
            'Attacker captures signed tx from network',
            'Attacker rebroadcasts identical transaction',
            'Node checks transaction_id — duplicate rejected ✓',
        ];
        this.renderSteps(simProgress, steps);
        controls.innerHTML = `<button type="button" class="btn btn--primary btn--sm" id="labRunReplay">Play simulation</button>`;
        controls.querySelector('#labRunReplay')?.addEventListener('click', () => this.playSteps(steps, null, simProgress));
    },

    renderDoubleSpendControls(controls, simContent, simProgress) {
        simContent.innerHTML = `
            <div class="lab-fork-viz">
                <div class="lab-fork-lane" id="labDsPublic">
                    <span class="lab-fork-label">Public chain (merchant sees payment)</span>
                    <div class="lab-fork-blocks" id="labDsPublicBlocks"></div>
                </div>
                <div class="lab-fork-lane lab-fork-lane--danger" id="labDsPrivate">
                    <span class="lab-fork-label">Private chain (attacker keeps coins)</span>
                    <div class="lab-fork-blocks" id="labDsPrivateBlocks"></div>
                </div>
            </div>
        `;
        const steps = [
            'Attacker sends payment to merchant on public chain',
            'Merchant accepts (0 confirmations)',
            'Attacker mines private fork without that payment',
            'Private chain becomes longer',
            'Public payment reversed — double-spend complete',
        ];
        if (simProgress) {
            this.renderSteps(simProgress, steps);
        }

        controls.innerHTML = `<button type="button" class="btn btn--primary btn--sm" id="labRunDs">Play simulation</button>`;
        controls.querySelector('#labRunDs')?.addEventListener('click', async () => {
            const pub = simContent.querySelector('#labDsPublicBlocks');
            const priv = simContent.querySelector('#labDsPrivateBlocks');
            await this.playSteps(steps, async (i) => {
                if (i === 1 && pub) pub.innerHTML = '<span class="lab-fork-block"></span><span class="lab-fork-block"></span>';
                if (i === 2 && priv) priv.innerHTML = '<span class="lab-fork-block"></span>';
                if (i === 3 && priv) priv.innerHTML = '<span class="lab-fork-block"></span><span class="lab-fork-block"></span><span class="lab-fork-block"></span>';
                if (i === 4) {
                    simContent.querySelector('#labDsPrivate')?.classList.add('lab-fork-lane--winner');
                    Toast.show('Longer private chain wins — merchant payment undone', 'info');
                }
            }, simProgress);
        });
    },

    renderNonceControls(controls, simContent, simProgress) {
        simContent.innerHTML = `<p class="text-muted" id="labNonceOut">Difficulty target: 4 leading zeros</p>`;
        const steps = [
            'Attacker submits block with nonce = 1',
            'Hash computed — insufficient leading zeros',
            'Validation rejects block (invalid PoW)',
            'Honest miners continue on valid tip',
        ];
        if (simProgress) this.renderSteps(simProgress, steps);
        controls.innerHTML = `<button type="button" class="btn btn--primary btn--sm" id="labRunNonce">Play simulation</button>`;
        controls.querySelector('#labRunNonce')?.addEventListener('click', async () => {
            await this.playSteps(steps, async (i) => {
                if (i === 1) {
                    const fake = await this.sha256('fake-block|nonce=1');
                    const out = simContent.querySelector('#labNonceOut');
                    if (out) out.innerHTML = `Computed hash: <code class="mono">${fake.slice(0, 20)}…</code> — needs <code>0000</code> prefix`;
                }
                if (i === 2) Toast.show('Block rejected — invalid proof-of-work', 'error');
            }, simProgress);
        });
    },

    renderTimestampControls(controls, simProgress) {
        const steps = [
            'Miner sets block timestamp far in the future',
            'Honest nodes compare against median past time',
            'Block rejected or delayed per protocol rules',
            'Network maintains consistent ordering',
        ];
        this.renderSteps(simProgress, steps);
        controls.innerHTML = `<button type="button" class="btn btn--primary btn--sm" id="labRunTime">Play simulation</button>`;
        controls.querySelector('#labRunTime')?.addEventListener('click', () => this.playSteps(steps, null, simProgress));
    },

    renderSelfishMiningControls(controls, simContent, simProgress) {
        simContent.innerHTML = `
            <div class="lab-fork-viz">
                <div class="lab-fork-lane"><span class="lab-fork-label">Public tip</span><div class="lab-fork-blocks" id="labSelfPublic"></div></div>
                <div class="lab-fork-lane lab-fork-lane--danger"><span class="lab-fork-label">Selfish private tip</span><div class="lab-fork-blocks" id="labSelfPrivate"></div></div>
            </div>
        `;
        const steps = [
            'Selfish miner finds block — withholds it',
            'Honest miners extend public chain',
            'Selfish miner secretly extends private chain',
            'Selfish miner releases blocks when public catches up',
            'Selfish miner earns disproportionate rewards',
        ];
        if (simProgress) this.renderSteps(simProgress, steps);
        controls.innerHTML = `<button type="button" class="btn btn--primary btn--sm" id="labRunSelfish">Play simulation</button>`;
        controls.querySelector('#labRunSelfish')?.addEventListener('click', async () => {
            const pub = simContent.querySelector('#labSelfPublic');
            const priv = simContent.querySelector('#labSelfPrivate');
            await this.playSteps(steps, async (i) => {
                if (i === 0 && priv) priv.innerHTML = '<span class="lab-fork-block"></span>';
                if (i === 1 && pub) pub.innerHTML = '<span class="lab-fork-block"></span>';
                if (i === 2 && priv) priv.innerHTML = '<span class="lab-fork-block"></span><span class="lab-fork-block"></span>';
                if (i === 3) {
                    if (pub) pub.innerHTML = '<span class="lab-fork-block"></span><span class="lab-fork-block"></span>';
                    if (priv) priv.innerHTML = '<span class="lab-fork-block"></span><span class="lab-fork-block"></span><span class="lab-fork-block"></span>';
                }
            }, simProgress);
        });
    },

    renderSybilControls(controls, simContent, simProgress) {
        simContent.innerHTML = `
            <div class="lab-network">
                <div class="lab-network-hub">Your node</div>
                <div class="lab-network-orbit" id="labSybilOrbit"></div>
            </div>
        `;
        const steps = [
            'Honest network has diverse peers',
            'Attacker registers many fake peer IDs',
            'Peer list fills with sybil identities',
            'Routing bias toward attacker-controlled endpoints',
        ];
        this.renderSteps(simProgress, steps);
        controls.innerHTML = `<button type="button" class="btn btn--primary btn--sm" id="labRunSybil">Play simulation</button>`;
        controls.querySelector('#labRunSybil')?.addEventListener('click', async () => {
            const orbit = simContent.querySelector('#labSybilOrbit');
            await this.playSteps(steps, async (i) => {
                if (!orbit) return;
                if (i === 1) orbit.innerHTML = '';
                if (i >= 1 && i <= 3) {
                    const count = i === 1 ? 4 : i === 2 ? 8 : 10;
                    orbit.innerHTML = '';
                    for (let n = 0; n < count; n += 1) {
                        const angle = (n / count) * Math.PI * 2 - Math.PI / 2;
                        const x = 50 + Math.cos(angle) * 38;
                        const y = 50 + Math.sin(angle) * 38;
                        const honest = n < 2 && i < 3;
                        orbit.insertAdjacentHTML('beforeend', `
                            <div class="lab-node ${honest ? 'lab-node--honest' : 'lab-node--sybil'}"
                                style="left:calc(${x}% - 26px);top:calc(${y}% - 26px)">${honest ? 'honest' : 'sybil'}</div>
                        `);
                    }
                }
            }, simProgress);
        });
    },

    renderEclipseControls(controls, simContent, simProgress) {
        simContent.innerHTML = `
            <div class="lab-network">
                <div class="lab-network-hub lab-network-hub--victim">Victim</div>
                <div class="lab-network-orbit" id="labEclipseOrbit"></div>
            </div>
        `;
        const steps = [
            'Victim connects to diverse peers',
            'Attacker fills all peer slots',
            'Victim only receives attacker chain data',
            'Victim accepts fake state or misses txs',
        ];
        this.renderSteps(simProgress, steps);
        controls.innerHTML = `<button type="button" class="btn btn--primary btn--sm" id="labRunEclipse">Play simulation</button>`;
        controls.querySelector('#labRunEclipse')?.addEventListener('click', async () => {
            const orbit = simContent.querySelector('#labEclipseOrbit');
            await this.playSteps(steps, async (i) => {
                if (!orbit) return;
                if (i === 0) {
                    orbit.innerHTML = ['A', 'B', 'C'].map((label, n) => {
                        const angle = (n / 3) * Math.PI * 2 - Math.PI / 2;
                        const x = 50 + Math.cos(angle) * 38;
                        const y = 50 + Math.sin(angle) * 38;
                        return `<div class="lab-node lab-node--honest" style="left:calc(${x}% - 26px);top:calc(${y}% - 26px)">${label}</div>`;
                    }).join('');
                }
                if (i >= 1) {
                    orbit.innerHTML = Array(6).fill(0).map((_, n) => {
                        const angle = (n / 6) * Math.PI * 2 - Math.PI / 2;
                        const x = 50 + Math.cos(angle) * 38;
                        const y = 50 + Math.sin(angle) * 38;
                        return `<div class="lab-node lab-node--eclipse lab-node--active" style="left:calc(${x}% - 26px);top:calc(${y}% - 26px)">att</div>`;
                    }).join('');
                }
                if (i === 3) Toast.show('Victim isolated — only attacker view visible', 'error');
            }, simProgress);
        });
    },

    async runReset() {
        if (!confirm('Reset the entire blockchain and all wallets?')) return;
        try {
            await BlockchainAPI.resetBlockchain();
            Toast.show('Blockchain reset to genesis', 'success');
            window.uiRenderer?.invalidateFingerprints();
            await Promise.all([
                window.uiRenderer?.renderBlockchain({ force: true }),
                window.uiRenderer?.renderStats(),
                window.uiRenderer?.renderWallets({ force: true }),
                window.uiRenderer?.renderTransactions({ force: true }),
                window.uiRenderer?.renderMiningStats(),
                window.uiRenderer?.validateBlockchain(),
            ]);
        } catch (err) {
            ErrorUtils.notify(err, { title: 'Reset' });
        }
    },
};

window.SecurityLab = SecurityLab;
