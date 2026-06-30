/* Developer tooling — console helpers and debug panel */

const DevTools = {
    panel: null,

    init() {
        if (!AppConfig.debug) return;

        Logger.info('Debug mode on — DevTools available as window.ChainDev');
        this.installConsoleHelpers();
        this.renderPanel();
    },

    installConsoleHelpers() {
        window.ChainDev = {
            config: () => AppConfig.toJSON(),
            setApi: (url) => {
                AppConfig.setApiBaseUrl(url);
                Logger.info('API URL set to', url);
            },
            enableDebug: () => AppConfig.enableDebug(),
            health: () => BlockchainAPI.health(),
            configRemote: () => BlockchainAPI.getConfig(),
            debugInfo: () => BlockchainAPI.getDebugInfo(),
            validate: () => BlockchainAPI.validateChain(),
            clearStorage: () => {
                ['chain_debug', 'chain_api_url', 'chain_log_level'].forEach(k => localStorage.removeItem(k));
                Logger.info('Cleared chain_* localStorage keys');
            },
        };
    },

    renderPanel() {
        if (document.getElementById('devToolsPanel')) return;

        const panel = document.createElement('aside');
        panel.id = 'devToolsPanel';
        panel.className = 'dev-panel';
        panel.innerHTML = `
            <div class="dev-panel__header">
                <strong>DevTools</strong>
                <button type="button" class="icon-btn icon-btn--sm" id="devPanelClose" aria-label="Close">×</button>
            </div>
            <div class="dev-panel__body">
                <p class="text-muted" style="font-size:0.75rem;margin:0 0 0.5rem">Open console: <code class="mono">ChainDev</code></p>
                <button type="button" class="btn btn--ghost btn--sm" id="devHealthCheck">Health check</button>
                <button type="button" class="btn btn--ghost btn--sm" id="devDumpConfig">Dump config</button>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('devPanelClose')?.addEventListener('click', () => panel.remove());
        document.getElementById('devHealthCheck')?.addEventListener('click', async () => {
            try {
                const h = await BlockchainAPI.health();
                Toast.show(`API healthy · uptime ${h.uptime_seconds}s`, 'success');
            } catch (err) {
                ErrorUtils.notify(err);
            }
        });
        document.getElementById('devDumpConfig')?.addEventListener('click', async () => {
            try {
                const c = await BlockchainAPI.getConfig();
                console.table(c.config);
                Toast.show('Config logged to console', 'info');
            } catch (err) {
                ErrorUtils.notify(err);
            }
        });
    },
};

window.DevTools = DevTools;
