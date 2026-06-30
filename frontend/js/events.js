/* User interactions and polling */

class EventManager {
    constructor(renderer) {
        this.renderer = renderer;
        this.poller = null;
        this.setupEventListeners();
        this.startRealTimePolling();
    }

    setupEventListeners() {
        window.createWallet = async () => {
            try {
                const name = document.getElementById('walletName').value.trim() || `Wallet_${Date.now()}`;
                const res = await BlockchainAPI.createWallet(name);
                Toast.show(`Wallet "${res.wallet.name}" created`, 'success');
                document.getElementById('walletName').value = '';
                this.renderer.invalidateFingerprints();
                await this.renderer.renderWallets({ force: true });
                await this.renderer.renderStats();
            } catch (err) {
                ErrorUtils.notify(err, { title: 'Wallet' });
            }
        };

        window.submitTransaction = async () => {
            const sender = document.getElementById('senderSelect').value;
            const receiver = document.getElementById('receiverSelect').value;
            const amount = parseFloat(document.getElementById('txAmount').value);

            if (!sender || !receiver || !amount) {
                Toast.show('Complete all transaction fields', 'error');
                return;
            }

            try {
                await BlockchainAPI.createTransaction({
                    sender_address: sender,
                    receiver_address: receiver,
                    amount,
                });
                Toast.show(`Submitted ${amount} coins to mempool`, 'success');
                document.getElementById('txAmount').value = '';
                this.renderer.invalidateFingerprints();
                await this.renderer.renderTransactions({ force: true });
                await this.renderer.renderWallets({ force: true });
                await this.renderer.renderStats();
            } catch (err) {
                ErrorUtils.notify(err, { title: 'Transaction' });
            }
        };

        window.mineBlock = async () => {
            const minerAddress = document.getElementById('minerSelect').value;
            if (!minerAddress) {
                Toast.show('Select a miner wallet', 'error');
                return;
            }

            const btn = document.querySelector('[onclick="mineBlock()"]');
            if (btn) btn.disabled = true;

            try {
                const result = await BlockchainAPI.mine(minerAddress);
                Toast.show(`Block #${result.block.index} mined`, 'success');
                this.renderer.invalidateFingerprints();
                await Promise.all([
                    this.renderer.renderBlockchain({ force: true }),
                    this.renderer.renderStats(),
                    this.renderer.renderMiningStats(),
                    this.renderer.renderTransactions({ force: true }),
                    this.renderer.renderWallets({ force: true }),
                ]);
            } catch (err) {
                ErrorUtils.notify(err, { title: 'Mining' });
            } finally {
                if (btn) btn.disabled = false;
            }
        };

        window.setDifficulty = async () => {
            const input = document.getElementById('difficultyInput');
            const difficultyValue = parseInt(input.value, 10);

            if (!difficultyValue || difficultyValue < 1) {
                Toast.show('Enter a valid difficulty (≥ 1)', 'error');
                return;
            }

            try {
                const result = await BlockchainAPI.setDifficulty(difficultyValue);
                Toast.show(`Difficulty set to ${result.difficulty}`, 'success');
                this.renderer.invalidateFingerprints();
                await Promise.all([
                    this.renderer.renderStats(),
                    this.renderer.renderMiningStats(),
                ]);
            } catch (err) {
                ErrorUtils.notify(err, { title: 'Difficulty' });
            }
        };

        window.validateBlockchain = async () => {
            await this.renderer.validateBlockchain();
        };

        window.resetBlockchain = async () => {
            if (window.SecurityLab?.runReset) {
                return SecurityLab.runReset();
            }
            if (!confirm('Reset the entire blockchain and all wallets?')) return;

            try {
                await BlockchainAPI.resetBlockchain();
                Toast.show('Blockchain reset to genesis', 'success');
                this.renderer.invalidateFingerprints();
                await Promise.all([
                    this.renderer.renderBlockchain({ force: true }),
                    this.renderer.renderStats(),
                    this.renderer.renderWallets({ force: true }),
                    this.renderer.renderTransactions({ force: true }),
                    this.renderer.renderMiningStats(),
                    this.renderer.validateBlockchain(),
                ]);
            } catch (err) {
                ErrorUtils.notify(err, { title: 'Reset' });
            }
        };

        window.copyHash = (elementId) => {
            const element = document.getElementById(elementId);
            if (!element) return;

            navigator.clipboard.writeText(element.textContent.trim()).then(() => {
                Toast.show('Hash copied', 'success');
            }).catch(() => Toast.show('Copy failed', 'error'));
        };
    }

    startRealTimePolling() {
        this.poller = Scheduler.createPoller(async () => {
            const view = NavManager.currentView || 'overview';

            await this.renderer.renderCurrentStats();

            if (['overview', 'transactions'].includes(view)) {
                await this.renderer.renderTransactions();
            }

            if (view === 'visualize' && window.Visualizations) {
                await Visualizations.onPollRefresh();
            }
        }, AppConfig.defaults.pollIntervalMs);
    }

    stopPolling() {
        this.poller?.stop();
    }
}
