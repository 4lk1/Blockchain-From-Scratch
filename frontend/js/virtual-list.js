/* Windowed virtual list for large tables */

class VirtualList {
    constructor(options) {
        this.scroller = options.scroller;
        this.tbody = options.tbody;
        this.items = options.items || [];
        this.rowHeight = options.rowHeight || 44;
        this.overscan = options.overscan ?? 6;
        this.renderRow = options.renderRow;
        this.colspan = options.colspan || 6;
        this._onScroll = () => this.render();
    }

    setItems(items) {
        this.items = items || [];
        this.render();
    }

    mount() {
        if (!this.scroller || !this.tbody) return;
        this.scroller.style.overflowY = 'auto';
        this.scroller.style.maxHeight = this.scroller.style.maxHeight || '520px';
        this.scroller.addEventListener('scroll', this._onScroll, { passive: true });
        this.render();
    }

    destroy() {
        this.scroller?.removeEventListener('scroll', this._onScroll);
    }

    render() {
        if (!this.tbody) return;

        const total = this.items.length;
        if (!total) {
            this.tbody.innerHTML = '';
            return;
        }

        const viewH = this.scroller.clientHeight || 520;
        const scrollTop = this.scroller.scrollTop || 0;
        const start = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.overscan);
        const visibleCount = Math.ceil(viewH / this.rowHeight) + this.overscan * 2;
        const end = Math.min(total, start + visibleCount);

        const topPad = start * this.rowHeight;
        const bottomPad = Math.max(0, (total - end) * this.rowHeight);

        const rows = [];
        if (topPad > 0) {
            rows.push(`<tr class="virtual-pad" aria-hidden="true"><td colspan="${this.colspan}" style="height:${topPad}px;padding:0;border:none"></td></tr>`);
        }

        for (let i = start; i < end; i += 1) {
            rows.push(this.renderRow(this.items[i], i));
        }

        if (bottomPad > 0) {
            rows.push(`<tr class="virtual-pad" aria-hidden="true"><td colspan="${this.colspan}" style="height:${bottomPad}px;padding:0;border:none"></td></tr>`);
        }

        this.tbody.innerHTML = rows.join('');
    }
}

window.VirtualList = VirtualList;
