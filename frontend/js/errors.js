/* API error parsing and user-friendly messages */

class ApiError extends Error {
    constructor(message, { status = 0, code = 'API_ERROR', details = null, requestId = null, raw = null } = {}) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.code = code;
        this.details = details;
        this.requestId = requestId;
        this.raw = raw;
    }

    get isNetworkError() {
        return this.status === 0;
    }

    get isClientError() {
        return this.status >= 400 && this.status < 500;
    }

    get isServerError() {
        return this.status >= 500;
    }

    toDisplayString() {
        if (this.isNetworkError) {
            return 'Cannot reach the API server. Is it running on the configured URL?';
        }
        return this.message;
    }
}

const ErrorUtils = {
    parseResponse(status, payload) {
        if (payload && typeof payload === 'object') {
            if (payload.error && typeof payload.error === 'object') {
                const err = payload.error;
                return new ApiError(err.message || 'Request failed', {
                    status,
                    code: err.code || err.type || 'API_ERROR',
                    details: err.details || null,
                    requestId: err.request_id || null,
                    raw: payload,
                });
            }
            if (payload.detail) {
                const detail = payload.detail;
                const message = typeof detail === 'string'
                    ? detail
                    : (detail.message || JSON.stringify(detail));
                return new ApiError(message, { status, code: 'HTTP_ERROR', raw: payload });
            }
            if (payload.message) {
                return new ApiError(payload.message, { status, raw: payload });
            }
        }

        const text = typeof payload === 'string' ? payload : `HTTP ${status}`;
        return new ApiError(text, { status, raw: payload });
    },

    fromUnknown(err, fallback = 'Something went wrong') {
        if (err instanceof ApiError) return err;
        if (err instanceof TypeError && /fetch|network/i.test(err.message)) {
            return new ApiError('Network request failed', { status: 0, code: 'NETWORK_ERROR' });
        }
        return new ApiError(err?.message || fallback, { status: 0, code: 'UNKNOWN' });
    },

    notify(err, { title = null, silent = false } = {}) {
        const apiErr = this.fromUnknown(err);
        if (silent) return apiErr;
        Toast.showError(apiErr, { title });
        return apiErr;
    },
};

window.ApiError = ApiError;
window.ErrorUtils = ErrorUtils;
