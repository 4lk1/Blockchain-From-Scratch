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

        const apiLabel = AppConfig.apiBaseUrl || window.location.origin;
        const hosted = !AppConfig._isLocalHostPage();
        const hint = hosted
            ? 'Deploy the FastAPI backend and set <code class="mono">CHAIN_API_URL</code> in Netlify, then redeploy. See README → Hosting on Netlify.'
            : '<code class="mono">python -m uvicorn backend.api:app --reload</code>';
        const storageHint = hosted
            ? '<p class="text-muted" style="font-size:0.75rem;margin-top:0.75rem">If you previously set a custom API URL in DevTools, clear it: <code class="mono">localStorage.removeItem(\'chain_api_url\')</code></p>'
            : '';

        const main = document.getElementById('main-content');
        if (main) {
            main.innerHTML = `
                <div class="state-block state-block--error" style="margin:var(--space-8) auto;max-width:520px">
                    <div class="state-block__icon">!</div>
                    <p class="state-block__title">Unable to connect</p>
                    <p class="state-block__message">${UIHelpers.escape(apiErr.toDisplayString())}</p>
                    <p class="text-muted" style="font-size:0.8125rem">API: <code class="mono">${UIHelpers.escape(apiLabel)}</code></p>
                    <button type="button" class="btn btn--primary btn--sm" onclick="location.reload()">Retry</button>
                    <div class="text-muted" style="margin-top:1rem;text-align:left;font-size:0.75rem">${hint}</div>
                    ${storageHint}
                </div>
            `;
        }
    }
}

Hooks.onReady(initializeApp);
