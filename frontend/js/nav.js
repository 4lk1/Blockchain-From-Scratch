/* Dashboard view navigation */

const NavManager = {
    currentView: 'overview',

    init() {
        this.views = document.querySelectorAll('[data-view-panel]');
        this.links = document.querySelectorAll('[data-view-link]');
        this.sidebar = document.getElementById('sidebar');
        this.overlay = document.getElementById('sidebarOverlay');
        this.menuBtn = document.getElementById('menuToggle');

        this.links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.show(link.dataset.viewLink);
                this.closeMobile();
            });
        });

        if (this.menuBtn) {
            this.menuBtn.addEventListener('click', () => this.toggleMobile());
        }
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.closeMobile());
        }

        const hash = window.location.hash.replace('#', '');
        if (hash) this.show(hash);

        window.addEventListener('hashchange', () => {
            const h = window.location.hash.replace('#', '');
            if (h) this.show(h);
        });
    },

    async show(viewIdOrPath) {
        let viewId = viewIdOrPath;
        let learnTopic = null;
        let labTopic = null;

        if (viewIdOrPath.includes('/')) {
            const [view, topic] = viewIdOrPath.split('/', 2);
            if (view === 'learn') {
                viewId = 'learn';
                learnTopic = topic;
            } else if (view === 'lab') {
                viewId = 'lab';
                labTopic = topic;
            }
        }

        const validViews = ['overview', 'blocks', 'transactions', 'wallets', 'mining', 'analytics', 'visualize', 'learn', 'lab'];
        if (!validViews.includes(viewId)) viewId = 'overview';

        const lazyViews = ['analytics', 'visualize', 'learn', 'lab'];
        if (lazyViews.includes(viewId)) {
            try {
                await ModuleLoader.ensure(viewId);
            } catch (err) {
                Logger.error(`Failed to load ${viewId} module`, err);
                Toast.showError(err, { title: 'Load failed' });
            }
        }

        if (this.currentView === 'analytics' && viewId !== 'analytics' && window.AnalyticsDashboard?.onViewInactive) {
            AnalyticsDashboard.onViewInactive();
        }

        this.currentView = viewId;

        this.views.forEach(panel => {
            const active = panel.dataset.viewPanel === viewId;
            panel.classList.toggle('view--active', active);
            panel.hidden = !active;
            panel.setAttribute('aria-hidden', active ? 'false' : 'true');
        });

        this.links.forEach(link => {
            const active = link.dataset.viewLink === viewId;
            link.classList.toggle('nav-link--active', active);
            if (active) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });

        const hash = learnTopic ? `learn/${learnTopic}` : (labTopic ? `lab/${labTopic}` : viewId);
        history.replaceState(null, '', `#${hash}`);

        if (window.Accessibility) {
            Accessibility.announceView(viewId, learnTopic);
        } else {
            document.getElementById('main-content')?.focus({ preventScroll: true });
        }

        if (viewId === 'blocks' && window.uiRenderer) {
            uiRenderer.renderBlockchain({ force: true });
        }
        if (viewId === 'transactions' && window.uiRenderer) {
            uiRenderer.renderTransactions({ force: true });
        }
        if (viewId === 'analytics' && window.AnalyticsDashboard) {
            AnalyticsDashboard.onViewActive();
        }
        if (viewId === 'visualize' && window.Visualizations) {
            Visualizations.onViewActive();
            Accessibility?.refreshRovingLists();
        }
        if (viewId === 'learn' && window.Education) {
            Education.onViewActive(learnTopic);
            Accessibility?.refreshRovingLists();
        }
        if (viewId === 'lab' && window.SecurityLab) {
            SecurityLab.onViewActive(labTopic);
            Accessibility?.refreshRovingLists();
        }
    },

    toggleMobile() {
        document.body.classList.toggle('sidebar-open');
    },

    closeMobile() {
        document.body.classList.remove('sidebar-open');
    },
};

window.NavManager = NavManager;
