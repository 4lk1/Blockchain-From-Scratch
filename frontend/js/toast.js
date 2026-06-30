/* Accessible toast notifications */

const Toast = {
    root: null,

    init() {
        this.root = document.getElementById('toastRoot');
    },

    show(message, type = 'info', duration = null) {
        if (!this.root) this.init();
        if (!this.root) return;

        const ms = duration ?? AppConfig.defaults.toastDurationMs;
        const toast = document.createElement('div');
        toast.className = `toast toast--${type}`;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
        toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');
        toast.textContent = message;

        this.root.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('toast--visible'));

        const remove = () => {
            toast.classList.remove('toast--visible');
            setTimeout(() => toast.remove(), 280);
        };

        setTimeout(remove, ms);
        toast.addEventListener('click', remove);
    },

    showWithTitle(title, message, type = 'info', duration = null) {
        if (!this.root) this.init();
        if (!this.root) return;

        const ms = duration ?? AppConfig.defaults.toastDurationMs;
        const toast = document.createElement('div');
        toast.className = `toast toast--${type} toast--rich`;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

        toast.innerHTML = `
            <strong class="toast__title">${title}</strong>
            <span class="toast__body">${message}</span>
        `;

        this.root.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('toast--visible'));

        const remove = () => {
            toast.classList.remove('toast--visible');
            setTimeout(() => toast.remove(), 280);
        };

        setTimeout(remove, type === 'error' ? ms + 2000 : ms);
        toast.addEventListener('click', remove);
    },

    showError(err, { title = 'Error' } = {}) {
        const apiErr = ErrorUtils.fromUnknown(err);
        let message = apiErr.toDisplayString();
        if (apiErr.requestId) {
            message += ` (ref: ${apiErr.requestId})`;
        }
        this.showWithTitle(title, message, 'error');
    },

    success(message) { this.show(message, 'success'); },
    info(message) { this.show(message, 'info'); },
    warning(message) { this.show(message, 'warning'); },
};

window.Toast = Toast;
