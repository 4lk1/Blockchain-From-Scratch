/* ========================================================================== */
/* Blockchain Explorer — Premium Frontend App */
/* ========================================================================== */

// ========================================================================== 
// API Service Layer
// ========================================================================== 

class BlockchainAPI {
    constructor(baseURL = 'http://localhost:8000') {
        this.baseURL = baseURL;
    }

    async request(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (body) options.body = JSON.stringify(body);

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, options);
            const contentType = response.headers.get('content-type') || '';
            const payload = contentType.includes('application/json')
                ? await response.json()
                : await response.text();

            if (!response.ok) {
                const message = payload?.detail || payload?.message || payload || `HTTP ${response.status}`;
                throw new Error(message);
            }

            return payload;
        } catch (err) {
            console.error(`API Error: ${endpoint}`, err);
            throw err;
        }
    }

    static health() { return new BlockchainAPI().request('/health'); }
    static getChain() { return new BlockchainAPI().request('/chain'); }
    static getStats() { return new BlockchainAPI().request('/stats'); }
    static getBlocks() { return new BlockchainAPI().request('/blocks'); }
    static getBlock(index) { return new BlockchainAPI().request(`/blocks/${index}`); }
    static validateChain() { return new BlockchainAPI().request('/validate'); }
    static getWallets() { return new BlockchainAPI().request('/wallets'); }
    static getWallet(address) { return new BlockchainAPI().request(`/wallets/${address}`); }
    static getTransactions() { return new BlockchainAPI().request('/transactions'); }
    static createTransaction(data) { return new BlockchainAPI().request('/transaction/create', 'POST', data); }
    static mine(minerAddress) { return new BlockchainAPI().request('/mine', 'POST', { miner_address: minerAddress }); }
    static tamperBlock(data) { return new BlockchainAPI().request('/tamper', 'POST', data); }
    static perform51Attack() { return new BlockchainAPI().request('/attack/51percent', 'POST'); }
    static resetBlockchain() { return new BlockchainAPI().request('/reset', 'POST'); }
}

// ========================================================================== 
// UI Renderer & State Management
// ========================================================================== 

class UIRenderer {
    constructor() {
        this.state = {
            chain: [],
            wallets: [],
            transactions: [],
            stats: null,
            selectedWallet: null,
        };
    }

    // ---- Stats & Dashboard ----
    async renderStats() {
        try {
            const stats = await BlockchainAPI.getStats();
            this.state.stats = stats;
            
            // Update navbar stats
            const navBlocks = document.getElementById('navBlocks');
            const navWallets = document.getElementById('navWallets');
            const navDifficulty = document.getElementById('navDifficulty');
            const chainValid = document.getElementById('chainValid');
            const chainLength = document.getElementById('chainLength');
            const pendingTx = document.getElementById('pendingTxCount');
            const integrity = document.getElementById('integrityStatus');
            
            if (navBlocks) navBlocks.textContent = stats.total_blocks || 1;
            if (navWallets) navWallets.textContent = stats.total_wallets || 0;
            if (navDifficulty) navDifficulty.textContent = stats.difficulty || 3;
            if (chainLength) chainLength.textContent = stats.total_blocks || 1;
            if (pendingTx) pendingTx.textContent = stats.pending_transactions || 0;
            if (integrity) integrity.textContent = stats.is_valid ? 'Valid ✓' : 'Invalid ✗';
            
            // Update chain validity indicator color
            if (chainValid) {
                chainValid.style.color = stats.is_valid ? 'var(--accent-success)' : 'var(--accent-danger)';
            }
        } catch (err) {
            console.error('Failed to render stats:', err);
        }
    }

    // ---- Blockchain Visualization ----
    async renderBlockchain() {
        try {
            const blocks = await BlockchainAPI.getBlocks();
            this.state.chain = blocks || [];
            
            const container = document.getElementById('blockchainViz');
            if (!container) return;
            
            container.innerHTML = '';
            const chainHTML = this.state.chain.map((block, idx) => {
                const miner = block.miner_address || (block.transactions && block.transactions.find(t => t.sender === 'SYSTEM')?.receiver) || 'N/A';
                const totalValue = block.total_value || (block.transactions ? block.transactions.reduce((s, t) => s + (t.amount || 0), 0) : 0);
                const timestamp = block.timestamp ? new Date(block.timestamp * 1000).toLocaleString() : '';
                return `
                <div class="block-node" data-index="${idx}">
                    <div class="block-header">Block #${block.index}</div>
                    <div class="block-info">
                        <div><strong>Hash:</strong> ${block.hash.substring(0, 12)}...</div>
                        <div><strong>Nonce:</strong> ${block.nonce || 0}</div>
                        <div><strong>Txs:</strong> ${block.transaction_count || (block.transactions || []).length}</div>
                        <div><strong>Total:</strong> ${totalValue} BTC</div>
                        <div><strong>Miner:</strong> ${miner}</div>
                        <div><strong>Difficulty:</strong> ${block.difficulty ?? 'N/A'}</div>
                        <div style="font-size:0.8rem;color:var(--text-tertiary)"><strong>Time:</strong> ${timestamp}</div>
                    </div>
                </div>
                ${idx < this.state.chain.length - 1 ? '<div class="chain-arrow">→</div>' : ''}
                `;
            }).join('');
            
            container.innerHTML = chainHTML;
            
            // Update last block display
            if (this.state.chain.length > 0) {
                const lastBlock = this.state.chain[this.state.chain.length - 1];
                const lastBlockHash = document.getElementById('lastBlockHash');
                const lastBlockIndex = document.getElementById('lastBlockIndex');
                const lastBlockNonce = document.getElementById('lastBlockNonce');
                
                if (lastBlockHash) lastBlockHash.textContent = `0x${lastBlock.hash.substring(0, 16)}`;
                if (lastBlockIndex) lastBlockIndex.textContent = this.state.chain.length - 1;
                if (lastBlockNonce) lastBlockNonce.textContent = lastBlock.nonce || 0;
            }
            
            // Animate blocks on scroll
            this.animateElements('.block-node');
        } catch (err) {
            console.error('Failed to render blockchain:', err);
        }
    }

    // ---- Wallets ----
    async renderWallets() {
        try {
            const walletsArray = await BlockchainAPI.getWallets();
            this.state.wallets = Array.isArray(walletsArray) ? walletsArray : (walletsArray.wallets || []);
            
            const container = document.getElementById('walletsGrid');
            if (!container) return;
            
            if (this.state.wallets.length === 0) {
                container.innerHTML = '<div class="empty-state">No wallets created yet. Create one to start.</div>';
                return;
            }
            
            container.innerHTML = this.state.wallets.map(wallet => `
                <div class="wallet-card" data-address="${wallet.address}">
                    <div class="wallet-name">${wallet.name || ('Wallet ' + wallet.address.substring(0, 8))}</div>
                    <div class="wallet-address">${wallet.address}</div>
                    <div class="wallet-balance">${wallet.balance} BTC</div>
                    <div style="font-size: 0.85rem; color: var(--text-tertiary); margin-top: 0.5rem;">
                        Transactions: ${wallet.transactions || 0}
                    </div>
                </div>
            `).join('');
            
            // Update selectors
            this.updateWalletSelectors();
            
            // Animate wallet cards
            this.animateElements('.wallet-card');
        } catch (err) {
            console.error('Failed to render wallets:', err);
        }
    }

    updateWalletSelectors() {
        const senderSelect = document.getElementById('senderSelect');
        const receiverSelect = document.getElementById('receiverSelect');
        const minerSelect = document.getElementById('minerSelect');
        
        const options = this.state.wallets.map(w => 
            `<option value="${w.address}">${w.name ? w.name + ' ' : ''}${w.address.substring(0, 10)}... (${w.balance} BTC)</option>`
        ).join('');
        
        if (senderSelect) senderSelect.innerHTML = '<option value="">Select sender</option>' + options;
        if (receiverSelect) receiverSelect.innerHTML = '<option value="">Select receiver</option>' + options;
        if (minerSelect) minerSelect.innerHTML = '<option value="">Select miner</option>' + options;
    }

    // ---- Transactions ----
    async renderTransactions() {
        try {
            const data = await BlockchainAPI.getTransactions();
            this.state.transactions = data.transactions || [];
            
            const container = document.getElementById('transactionList');
            if (!container) return;
            
            if (this.state.transactions.length === 0) {
                container.innerHTML = '<div class="empty-state">No transactions yet</div>';
                return;
            }
            
            container.innerHTML = this.state.transactions.slice(-10).reverse().map(tx => `
                <div class="transaction-item">
                    <div class="transaction-flow">
                        <div class="transaction-from">${(this.state.wallets.find(w => w.address === tx.sender)?.name || tx.sender.substring(0,8))} → ${(this.state.wallets.find(w => w.address === tx.receiver)?.name || tx.receiver.substring(0,8))}</div>
                        <div class="transaction-amount">${tx.amount} BTC</div>
                    </div>
                    <div style="color: var(--text-tertiary); font-size: 0.85rem;">
                        ${new Date(tx.timestamp * 1000).toLocaleTimeString()}
                    </div>
                </div>
            `).join('');
            
            this.animateElements('.transaction-item');
        } catch (err) {
            console.error('Failed to render transactions:', err);
        }
    }

    // ---- Mining Stats ----
    async renderMiningStats() {
        try {
            const stats = await BlockchainAPI.getStats();
            
            document.getElementById('currentNonce').textContent = stats.nonce || 0;
            document.getElementById('hashAttempts').textContent = stats.hash_attempts || 0;
            document.getElementById('miningTime').textContent = stats.mining_time ? `${stats.mining_time}s` : '0s';
            
            // Update mining parameters panel
            const diffEl = document.getElementById('statsdifficulty');
            const rewardEl = document.getElementById('statsReward');
            const valueEl = document.getElementById('totalValue');
            
            if (diffEl) diffEl.textContent = stats.difficulty || 3;
            if (rewardEl) rewardEl.textContent = '10.0';
            if (valueEl) {
                const totalValue = (stats.total_blocks || 1) * 10;
                valueEl.textContent = totalValue;
            }
        } catch (err) {
            console.error('Failed to render mining stats:', err);
        }
    }

    // ---- Validation ----
    async validateBlockchain() {
        try {
            const result = await BlockchainAPI.validateChain();
            const container = document.getElementById('validationResults');
            
            if (container) {
                container.innerHTML = `
                    <div class="validation-item ${result.is_valid ? 'success' : 'error'}">
                        Chain Status: <strong>${result.is_valid ? '✓ Valid' : '✗ Invalid'}</strong>
                    </div>
                    <div class="validation-item">
                        Total Blocks: ${result.total_blocks}
                    </div>
                    <div class="validation-item">
                        Total Transactions: ${result.total_transactions}
                    </div>
                `;
            }
        } catch (err) {
            console.error('Failed to validate blockchain:', err);
        }
    }

    // ---- General Animation Helper ----
    animateElements(selector) {
        const elements = document.querySelectorAll(selector);
        elements.forEach((el, idx) => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(10px)';
            setTimeout(() => {
                el.style.transition = 'all 0.3s ease-out';
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }, idx * 50);
        });
    }
}

// ========================================================================== 
// Animation System - Premium Motion & Effects
// ========================================================================== 

class AnimationEngine {
    constructor() {
        this.observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        this.initIntersectionObserver();
        this.startAnimationLoop();
    }

    initIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    this.observer.unobserve(entry.target);
                }
            });
        }, this.observerOptions);

        document.querySelectorAll('.glass-panel, .section, .block-node, .wallet-card').forEach(el => {
            this.observer.observe(el);
        });
    }

    startAnimationLoop() {
        let time = 0;
        const animate = () => {
            time += 0.01;

            // Aurora orb floating animations
            document.querySelectorAll('.aurora-orb').forEach((orb, idx) => {
                const offset = Math.sin(time * 0.5 + idx) * 20;
                orb.style.transform = `translate(${offset}px, ${Math.cos(time * 0.3 + idx) * 30}px)`;
            });

            requestAnimationFrame(animate);
        };
        animate();
    }

    // Scroll parallax effect
    initParallax() {
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            document.querySelectorAll('.aurora-layer').forEach((layer, idx) => {
                const speed = (idx + 1) * 0.5;
                layer.style.transform = `translateY(${scrollY * speed * 0.1}px)`;
            });
        });
    }

    // Float animation trigger
    addFloatEffect(element) {
        let floatOffset = 0;
        const animate = () => {
            floatOffset = Math.sin(Date.now() * 0.003) * 8;
            element.style.transform = `translateY(${floatOffset}px)`;
            requestAnimationFrame(animate);
        };
        animate();
    }
}

// ========================================================================== 
// Event Handlers & Interactivity
// ========================================================================== 

class EventManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.pollingInterval = null;
        this.setupEventListeners();
        this.startRealTimePolling();
    }

    setupEventListeners() {
        // Create Wallet
        window.createWallet = async () => {
            try {
                const name = document.getElementById('walletName').value || `Wallet_${Date.now()}`;
                const createResponse = await new BlockchainAPI().request('/wallet/create', 'POST', { name });
                alert(`Wallet created!\nName: ${createResponse.wallet.name}\nAddress: ${createResponse.wallet.address}\nBalance: ${createResponse.wallet.balance} BTC`);
                document.getElementById('walletName').value = '';
                await this.renderer.renderWallets();
                await this.renderer.renderStats();
            } catch (err) {
                alert('Failed to create wallet: ' + err.message);
            }
        };

        // Submit Transaction
        window.submitTransaction = async () => {
            const sender = document.getElementById('senderSelect').value;
            const receiver = document.getElementById('receiverSelect').value;
            const amount = parseFloat(document.getElementById('txAmount').value);

            if (!sender || !receiver || !amount) {
                alert('Please fill all transaction fields');
                return;
            }

            try {
                await BlockchainAPI.createTransaction({
                    sender_address: sender,
                    receiver_address: receiver,
                    amount,
                });
                const senderName = this.state.wallets.find(w => w.address === sender)?.name || sender.substring(0,10);
                const receiverName = this.state.wallets.find(w => w.address === receiver)?.name || receiver.substring(0,10);
                alert(`Transaction created!\nFrom: ${senderName}\nTo: ${receiverName}\nAmount: ${amount} BTC`);
                document.getElementById('txAmount').value = '';
                await this.renderer.renderTransactions();
                await this.renderer.renderWallets();
            } catch (err) {
                alert('Transaction failed: ' + err.message);
            }
        };

        // Mine Block
        window.mineBlock = async () => {
            const minerAddress = document.getElementById('minerSelect').value;
            if (!minerAddress) {
                alert('Select a miner wallet first');
                return;
            }

            try {
                const minerName = this.renderer.state.wallets.find(w => w.address === minerAddress)?.name || minerAddress.substring(0,10);
                const result = await BlockchainAPI.mine(minerAddress);
                alert(`Block mined by ${minerName}!\nHash: ${result.block.hash.substring(0, 16)}...`);
                await Promise.all([
                    this.renderer.renderBlockchain(),
                    this.renderer.renderStats(),
                    this.renderer.renderMiningStats(),
                    this.renderer.renderTransactions(),
                    this.renderer.renderWallets()
                ]);
            } catch (err) {
                alert('Mining failed: ' + err.message);
            }
        };

        // Set Mining Difficulty
        window.setDifficulty = async () => {
            const input = document.getElementById('difficultyInput');
            const difficultyValue = parseInt(input.value);

            if (!difficultyValue || difficultyValue < 1) {
                alert('Enter a valid difficulty (1 or higher)');
                return;
            }

            try {
                const result = await new BlockchainAPI().request('/settings/difficulty', 'POST', { difficulty: difficultyValue });
                alert(`Difficulty updated to ${result.difficulty}!\n⚡ Mining will now require ${result.difficulty} leading zeros`);
                await Promise.all([
                    this.renderer.renderStats(),
                    this.renderer.renderMiningStats()
                ]);
            } catch (err) {
                alert('Failed to update difficulty: ' + err.message);
            }
        };

        // Validate Blockchain
        window.validateBlockchain = async () => {
            await this.renderer.validateBlockchain();
        };

        // Tamper with Block
        window.performTamper = async () => {
            const blockIdx = parseInt(document.getElementById('tamperBlockIndex').value);
            const txIdx = parseInt(document.getElementById('tamperTxIndex').value);
            const amount = parseFloat(document.getElementById('tamperAmount').value);

            if (isNaN(blockIdx) || isNaN(txIdx) || isNaN(amount)) {
                alert('Enter valid values for block index, tx index, and amount');
                return;
            }

            try {
                const result = await BlockchainAPI.tamperBlock({
                    block_index: blockIdx,
                    transaction_index: txIdx,
                    new_amount: amount
                });

                const resultsDiv = document.getElementById('tamperResults');
                resultsDiv.classList.remove('hidden');
                
                const content = document.getElementById('tamperComparison');
                content.innerHTML = `
                    <div class="validation-item ${result.chain_valid ? 'success' : 'error'}">
                        <strong>${result.chain_valid ? '✓ Chain Remains Valid' : '⚠️ Tampering Detected!'}</strong>
                    </div>
                    <div class="validation-item">
                        Before Amount: ${result.before?.amount ?? amount} BTC
                    </div>
                    <div class="validation-item">
                        After Amount: ${result.after?.amount ?? amount} BTC
                    </div>
                    <div class="validation-item">
                        Chain Status: ${result.chain_valid ? 'Valid' : 'Invalid'}
                    </div>
                `;

                await this.renderer.validateBlockchain();
            } catch (err) {
                alert('Tampering failed: ' + err.message);
            }
        };

        // 51% Attack Simulation
        window.simulate51Attack = async () => {
            try {
                const result = await BlockchainAPI.perform51Attack();
                
                const resultsDiv = document.getElementById('attackResults');
                resultsDiv.classList.remove('hidden');
                const content = document.getElementById('attackResultsContent');
                
                if (result.success) {
                    content.innerHTML = `
                        <div class="validation-item error">
                            <strong>⚠️ Attack Successful!</strong>
                        </div>
                        <div class="validation-item">
                            Attacker took over the network.
                        </div>
                        <div class="validation-item">
                            Attacker Blocks: ${result.attacker_chain_length}
                        </div>
                        <div class="validation-item">
                            Public Chain Length: ${result.public_chain_length}
                        </div>
                    `;
                } else {
                    content.innerHTML = `
                        <div class="validation-item success">
                            <strong>✓ Attack Failed!</strong>
                        </div>
                        <div class="validation-item">
                            Network defended against attack.
                        </div>
                        <div class="validation-item">
                            Public Chain Length: ${result.public_chain_length}
                        </div>
                    `;
                }

                // Animate chain race
                const honestChain = document.getElementById('honestChain');
                const attackerChain = document.getElementById('attackerChain');
                
                honestChain.innerHTML = '';
                attackerChain.innerHTML = '';
                
                const honestLength = result.public_chain_length || 5;
                for (let i = 0; i < honestLength; i++) {
                    const block = document.createElement('div');
                    block.className = 'chain-block';
                    honestChain.appendChild(block);
                }
                
                for (let i = 0; i < (result.attacker_chain_length || 7); i++) {
                    const block = document.createElement('div');
                    block.className = 'chain-block';
                    attackerChain.appendChild(block);
                }
            } catch (err) {
                alert('Attack simulation failed: ' + err.message);
            }
        };

        // Reset Blockchain
        window.resetBlockchain = async () => {
            if (!confirm('Are you sure? This will reset the entire blockchain.')) return;
            
            try {
                await BlockchainAPI.resetBlockchain();
                alert('Blockchain reset!');
                await Promise.all([
                    this.renderer.renderBlockchain(),
                    this.renderer.renderStats(),
                    this.renderer.renderWallets(),
                    this.renderer.renderTransactions(),
                    this.renderer.renderMiningStats(),
                    this.renderer.validateBlockchain()
                ]);
            } catch (err) {
                alert('Reset failed: ' + err.message);
            }
        };

        // Copy hash to clipboard
        window.copyHash = (elementId) => {
            const element = document.getElementById(elementId);
            if (!element) return;
            
            const text = element.textContent;
            navigator.clipboard.writeText(text).then(() => {
                const btn = event.target;
                const original = btn.textContent;
                btn.textContent = '✓ Copied!';
                setTimeout(() => { btn.textContent = original; }, 2000);
            });
        };

        // Scroll to section
        window.scrollTo = (sectionId) => {
            const el = document.getElementById(sectionId);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        };
    }

    startRealTimePolling() {
        const poll = async () => {
            try {
                await this.renderer.renderCurrentStats();
                await this.renderer.renderTransactions();
            } catch (err) {
                console.log('Polling error (non-critical):', err);
            }
        };

        poll();
        this.pollingInterval = setInterval(poll, 2000);
    }

    stopPolling() {
        if (this.pollingInterval) clearInterval(this.pollingInterval);
    }
}

// Extend UIRenderer with current stats method
UIRenderer.prototype.renderCurrentStats = async function() {
    try {
        const stats = await BlockchainAPI.getStats();
        this.state.stats = stats;

        // Update navbar stats
        const elements = {
            'total-blocks': stats.total_blocks || 0,
            'total-transactions': stats.total_transactions || 0,
            'total-wallets': stats.total_wallets || 0,
            'chain-valid': stats.is_valid ? 'Valid ✓' : 'Invalid ✗'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const el = document.getElementById(id);
            if (el) el.textContent = value;
        });
    } catch (err) {
        console.error('Failed to update current stats:', err);
    }
};

// ========================================================================== 
// Application Initialization
// ========================================================================== 

async function initializeApp() {
    console.log('🚀 Initializing Blockchain Explorer...');

    try {
        // Health check
        await BlockchainAPI.health();
        console.log('✓ Backend connected');

        // Initialize systems
        const renderer = new UIRenderer();
        const animator = new AnimationEngine();
        animator.initParallax();
        const eventManager = new EventManager(renderer);

        // Initial render
        console.log('📊 Loading blockchain data...');
        await Promise.all([
            renderer.renderStats(),
            renderer.renderBlockchain(),
            renderer.renderWallets(),
            renderer.renderTransactions(),
            renderer.renderMiningStats(),
            renderer.validateBlockchain()
        ]);

        console.log('✓ Blockchain Explorer ready!');

        // Cleanup on page unload
        window.addEventListener('beforeunload', () => {
            eventManager.stopPolling();
        });

    } catch (err) {
        console.error('❌ Initialization failed:', err);
        document.body.innerHTML = `
            <div class="error-overlay" style="
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                background: var(--bg-primary);
                text-align: center;
                color: var(--accent-danger);
            ">
                <div>
                    <h2>Failed to Connect to Backend</h2>
                    <p>Make sure the FastAPI server is running on http://localhost:8000</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-tertiary);">
                        Run: cd blockchain_project && python -m uvicorn backend.api:app --reload
                    </p>
                </div>
            </div>
        `;
    }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
