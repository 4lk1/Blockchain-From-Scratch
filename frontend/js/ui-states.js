/* Reusable loading, empty, and error UI states */

const UIStates = {
    skeletonRow(cols = 4) {
        return `<tr class="state-row state-row--loading">${Array(cols).fill('<td><span class="skeleton skeleton--text"></span></td>').join('')}</tr>`;
    },

    loading(options = {}) {
        const {
            message = 'Loading…',
            inline = false,
            rows = 0,
            cols = 4,
        } = options;

        if (rows > 0) {
            return Array(rows).fill(this.skeletonRow(cols)).join('');
        }

        const cls = inline ? 'state-inline state-inline--loading' : 'state-block state-block--loading';
        return `
            <div class="${cls}" role="status" aria-live="polite">
                <span class="spinner" aria-hidden="true"></span>
                <span>${message}</span>
            </div>
        `;
    },

    empty(options = {}) {
        const {
            title = 'Nothing here yet',
            message = '',
            actionLabel = null,
            actionHref = null,
            icon = '○',
        } = options;

        return `
            <div class="state-block state-block--empty">
                <div class="state-block__icon" aria-hidden="true">${icon}</div>
                <p class="state-block__title">${title}</p>
                ${message ? `<p class="state-block__message">${message}</p>` : ''}
                ${actionLabel && actionHref ? `<a href="${actionHref}" class="btn btn--secondary btn--sm">${actionLabel}</a>` : ''}
            </div>
        `;
    },

    emptyCell(colspan, message = 'No data') {
        return `<tr><td colspan="${colspan}" class="empty-cell">${message}</td></tr>`;
    },

    error(options = {}) {
        const {
            title = 'Failed to load',
            message = 'Something went wrong. Try again.',
            retryLabel = 'Retry',
            retryId = null,
        } = options;

        return `
            <div class="state-block state-block--error" role="alert">
                <div class="state-block__icon" aria-hidden="true">!</div>
                <p class="state-block__title">${title}</p>
                <p class="state-block__message">${message}</p>
                ${retryLabel ? `<button type="button" class="btn btn--secondary btn--sm" ${retryId ? `id="${retryId}"` : ''} data-state-retry>${retryLabel}</button>` : ''}
            </div>
        `;
    },

    setLoading(el, options) {
        if (!el) return;
        if (!el.dataset.stateOriginal) el.dataset.stateOriginal = el.innerHTML;
        el.innerHTML = this.loading(options);
        el.setAttribute('aria-busy', 'true');
    },

    setEmpty(el, options) {
        if (!el) return;
        delete el.dataset.stateOriginal;
        el.innerHTML = this.empty(options);
        el.removeAttribute('aria-busy');
    },

    setError(el, options) {
        if (!el) return;
        delete el.dataset.stateOriginal;
        el.innerHTML = this.error(options);
        el.removeAttribute('aria-busy');
    },

    restore(el) {
        if (!el?.dataset.stateOriginal) return;
        el.innerHTML = el.dataset.stateOriginal;
        delete el.dataset.stateOriginal;
        el.removeAttribute('aria-busy');
    },

    clearBusy(el) {
        if (el) el.removeAttribute('aria-busy');
    },
};

window.UIStates = UIStates;
