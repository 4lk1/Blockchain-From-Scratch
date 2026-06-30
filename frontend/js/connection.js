/* Global API connection status banner */

const ConnectionStatus = {
    banner: null,
    online: true,

    init() {
        this.banner = document.getElementById('connectionBanner');
    },

    markOnline() {
        if (this.online) return;
        this.online = true;
        Logger.info('API connection restored');
        if (this.banner) {
            this.banner.hidden = true;
            this.banner.classList.remove('connection-banner--offline');
        }
        UIHelpers.setStatus(true);
        Accessibility?.announce('Connection restored');
    },

    markOffline(message) {
        if (!this.online) return;
        this.online = false;
        Logger.warn('API connection lost:', message);
        if (this.banner) {
            this.banner.hidden = false;
            this.banner.classList.add('connection-banner--offline');
            const text = this.banner.querySelector('[data-connection-text]');
            if (text) {
                text.textContent = message || 'Cannot connect to the API server.';
            }
        }
        const integrity = document.getElementById('integrityStatus');
        if (integrity) integrity.textContent = 'Offline';
        const dot = document.getElementById('chainValid');
        if (dot) {
            dot.classList.remove('status-dot--valid');
            dot.classList.add('status-dot--invalid');
        }
        Accessibility?.announce(message || 'API connection lost', { assertive: true });
    },
};

window.ConnectionStatus = ConnectionStatus;
