/* Application bootstrap */

async function initializeApp() {
    AppConfig.init();
    Logger.init();
    Scheduler.init();
    Toast.init();
    ConnectionStatus.init();
    Accessibility.init();
    NavManager.init();
    DevTools.init();

    const loader = document.getElementById('appLoader');
    const shell = document.querySelector('.app-shell');

    try {
        Logger.info('Connecting to', AppConfig.apiBaseUrl);
        await BlockchainAPI.health();

        if (loader) loader.hidden = true;
        if (shell) shell.classList.remove('app-shell--loading');

        const renderer = new UIRenderer();
        window.uiRenderer = renderer;
        const eventManager = new EventManager(renderer);

        await Promise.all([
            renderer.renderStats(),
            renderer.renderBlockchain({ force: true }),
            renderer.renderWallets({ force: true }),
            renderer.renderTransactions({ force: true }),
            renderer.renderMiningStats(),
            renderer.validateBlockchain(),
        ]);

        Logger.info('Dashboard initialized');
        window.addEventListener('beforeunload', () => eventManager.stopPolling());
    } catch (err) {
        Logger.error('Initialization failed', err);
        if (loader) loader.hidden = true;
        if (shell) shell.classList.remove('app-shell--loading');

        const apiErr = ErrorUtils.fromUnknown(err);
        ConnectionStatus.markOffline(apiErr.toDisplayString());

        const main = document.getElementById('main-content');
        if (main) {
            main.innerHTML = `
                <div class="state-block state-block--error" style="margin:var(--space-8) auto;max-width:480px">
                    <div class="state-block__icon">!</div>
                    <p class="state-block__title">Unable to connect</p>
                    <p class="state-block__message">${apiErr.toDisplayString()}</p>
                    <p class="text-muted" style="font-size:0.8125rem">API: <code class="mono">${AppConfig.apiBaseUrl}</code></p>
                    <button type="button" class="btn btn--primary btn--sm" onclick="location.reload()">Retry</button>
                    <code class="mono block" style="margin-top:1rem;text-align:left;font-size:0.75rem">python -m uvicorn backend.api:app --reload</code>
                </div>
            `;
        }
    }
}

Hooks.onReady(initializeApp);
