/* Accessibility — keyboard navigation, screen readers, focus management */

const Accessibility = {
    announcer: null,
    lastFocusedBeforeSidebar: null,

    init() {
        this.announcer = document.getElementById('a11yAnnouncer');
        this.setupKeyboard();
        this.setupHighContrast();
        this.setupRovingGroups();
        this.setupSidebarA11y();
        this.enhanceIntegrityStatus();
    },

    announce(message, { assertive = false } = {}) {
        if (!this.announcer || !message) return;
        this.announcer.setAttribute('aria-live', assertive ? 'assertive' : 'polite');
        this.announcer.textContent = '';
        requestAnimationFrame(() => {
            this.announcer.textContent = message;
        });
    },

    announceView(viewId, learnTopic) {
        const labels = {
            overview: 'Network Overview',
            blocks: 'Blocks',
            transactions: 'Transactions',
            wallets: 'Wallets',
            mining: 'Mining',
            analytics: 'Analytics',
            visualize: 'Visualize',
            learn: 'Learn',
            lab: 'Security Lab',
        };
        let name = labels[viewId] || viewId;
        if (viewId === 'learn' && learnTopic) {
            name = `Learn: ${learnTopic.replace(/-/g, ' ')}`;
        }
        this.announce(`${name} view loaded`);

        const panel = document.querySelector(`[data-view-panel="${viewId}"]`);
        const heading = panel?.querySelector('.page-title, h1, h2');
        if (heading && typeof heading.focus === 'function') {
            if (!heading.hasAttribute('tabindex')) {
                heading.setAttribute('tabindex', '-1');
            }
            heading.focus({ preventScroll: false });
        }
    },

    setupKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (document.body.classList.contains('sidebar-open')) {
                    NavManager.closeMobile();
                    document.getElementById('menuToggle')?.focus();
                    e.preventDefault();
                }
            }

            if (e.key === '?' && !this.isTyping(e.target)) {
                this.showShortcutsHelp();
                e.preventDefault();
            }
        });
    },

    isTyping(el) {
        if (!el) return false;
        const tag = el.tagName?.toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    },

    showShortcutsHelp() {
        const existing = document.getElementById('a11yShortcutsDialog');
        if (existing) {
            existing.remove();
            return;
        }

        const dialog = document.createElement('div');
        dialog.id = 'a11yShortcutsDialog';
        dialog.className = 'card';
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-labelledby', 'a11yShortcutsTitle');
        dialog.style.cssText = 'position:fixed;bottom:1rem;right:1rem;z-index:300;max-width:320px;padding:1rem;';

        dialog.innerHTML = `
            <h2 id="a11yShortcutsTitle" style="margin:0 0 0.75rem;font-size:1rem">Keyboard shortcuts</h2>
            <ul class="a11y-shortcuts" style="list-style:none;padding:0;margin:0">
                <li><kbd>Tab</kbd> Move focus</li>
                <li><kbd>Enter</kbd> / <kbd>Space</kbd> Activate</li>
                <li><kbd>↑</kbd><kbd>↓</kbd> Topic lists (Visualize / Learn)</li>
                <li><kbd>Esc</kbd> Close menu</li>
                <li><kbd>?</kbd> Toggle this help</li>
            </ul>
            <button type="button" class="btn btn--secondary btn--sm" style="margin-top:0.75rem" id="a11yShortcutsClose">Close</button>
        `;

        document.body.appendChild(dialog);
        dialog.querySelector('#a11yShortcutsClose')?.addEventListener('click', () => dialog.remove());
        dialog.querySelector('#a11yShortcutsClose')?.focus();
        this.announce('Keyboard shortcuts dialog opened');
    },

    setupHighContrast() {
        const saved = localStorage.getItem('chain_contrast');
        if (saved === 'high') {
            document.documentElement.setAttribute('data-contrast', 'high');
        }

        if (window.matchMedia('(prefers-contrast: more)').matches && saved !== 'normal') {
            document.documentElement.setAttribute('data-contrast', 'high');
        }

        const toggle = document.getElementById('contrastToggle');
        if (toggle) {
            this.updateContrastLabel(toggle);
            toggle.addEventListener('click', () => this.toggleContrast());
        }
    },

    toggleContrast() {
        const html = document.documentElement;
        const isHigh = html.getAttribute('data-contrast') === 'high';
        if (isHigh) {
            html.setAttribute('data-contrast', 'normal');
            localStorage.setItem('chain_contrast', 'normal');
            Toast.show('Standard contrast', 'info');
        } else {
            html.setAttribute('data-contrast', 'high');
            localStorage.setItem('chain_contrast', 'high');
            Toast.show('High contrast enabled', 'info');
        }
        const toggle = document.getElementById('contrastToggle');
        if (toggle) this.updateContrastLabel(toggle);
        this.announce(isHigh ? 'Standard contrast mode' : 'High contrast mode enabled');
    },

    updateContrastLabel(btn) {
        const high = document.documentElement.getAttribute('data-contrast') === 'high';
        btn.setAttribute('aria-label', high ? 'Disable high contrast' : 'Enable high contrast');
        btn.setAttribute('aria-pressed', high ? 'true' : 'false');
    },

    setupRovingGroups() {
        this.bindRovingList('[data-viz-topic]', (el) => {
            Visualizations?.showTopic(el.dataset.vizTopic);
        });
        this.bindRovingList('[data-lab-topic]', (el) => {
            NavManager.show(`lab/${el.dataset.labTopic}`);
        });
        this.bindRovingList('[data-edu-topic]', (el) => {
            NavManager.show(`learn/${el.dataset.eduTopic}`);
        });
    },

    bindRovingList(selector, onActivate) {
        document.addEventListener('keydown', (e) => {
            const items = [...document.querySelectorAll(selector)];
            if (!items.length) return;

            const active = document.activeElement;
            const idx = items.indexOf(active);
            if (idx === -1 && !items[0]?.closest('.view--active')) return;

            let next = idx;
            if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                next = idx < 0 ? 0 : (idx + 1) % items.length;
                e.preventDefault();
            } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                next = idx < 0 ? items.length - 1 : (idx - 1 + items.length) % items.length;
                e.preventDefault();
            } else if ((e.key === 'Enter' || e.key === ' ') && idx >= 0) {
                e.preventDefault();
                onActivate(active);
                return;
            } else {
                return;
            }

            items[next]?.focus();
        });

        document.querySelectorAll(selector).forEach((el, i) => {
            if (el.tagName === 'BUTTON' && !el.hasAttribute('type')) {
                el.setAttribute('type', 'button');
            }
            el.setAttribute('tabindex', i === 0 ? '0' : '-1');
            el.addEventListener('focus', () => {
                document.querySelectorAll(selector).forEach(sib => {
                    sib.setAttribute('tabindex', sib === el ? '0' : '-1');
                });
            });
        });
    },

    setupSidebarA11y() {
        const menuBtn = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');

        if (menuBtn && sidebar) {
            menuBtn.setAttribute('aria-controls', 'sidebar');
            menuBtn.setAttribute('aria-expanded', 'false');

            const updateSidebarState = () => {
                const isMobile = window.matchMedia('(max-width: 768px)').matches;
                const open = document.body.classList.contains('sidebar-open');
                menuBtn.setAttribute('aria-expanded', isMobile && open ? 'true' : 'false');
                menuBtn.setAttribute('aria-label', isMobile && open ? 'Close navigation menu' : 'Open navigation menu');

                if (isMobile) {
                    sidebar.setAttribute('aria-hidden', open ? 'false' : 'true');
                } else {
                    sidebar.removeAttribute('aria-hidden');
                }
            };

            const observer = new MutationObserver(updateSidebarState);
            observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
            window.addEventListener('resize', updateSidebarState);
            updateSidebarState();
        }

        if (overlay) {
            overlay.setAttribute('aria-hidden', 'true');
        }
    },

    enhanceIntegrityStatus() {
        const status = document.getElementById('integrityStatus');
        if (status) {
            status.setAttribute('role', 'status');
            status.setAttribute('aria-live', 'polite');
        }

        const networkPill = document.getElementById('networkStatus');
        if (networkPill) {
            networkPill.setAttribute('aria-label', 'Network integrity status');
        }
    },

    refreshRovingLists() {
        document.querySelectorAll('[data-viz-topic], [data-lab-topic], [data-edu-topic]').forEach((el) => {
            const selector = el.hasAttribute('data-viz-topic')
                ? '[data-viz-topic]'
                : el.hasAttribute('data-lab-topic')
                    ? '[data-lab-topic]'
                    : '[data-edu-topic]';
            const siblings = [...document.querySelectorAll(selector)];
            const idx = siblings.indexOf(el);
            el.setAttribute('tabindex', idx === 0 ? '0' : '-1');
        });
    },
};

window.Accessibility = Accessibility;
