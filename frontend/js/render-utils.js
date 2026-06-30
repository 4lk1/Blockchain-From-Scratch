/* Render helpers — fingerprints, indexed lookups, DOM batching */

const RenderUtils = {
    fingerprintStats(stats) {
        if (!stats) return '';
        return [
            stats.total_blocks,
            stats.pending_transactions,
            stats.total_wallets,
            stats.chain_valid,
            stats.mining_difficulty ?? stats.difficulty,
        ].join(':');
    },

    fingerprintBlocks(blocks) {
        if (!blocks?.length) return '0';
        const last = blocks[blocks.length - 1];
        return `${blocks.length}:${last.index}:${last.hash}`;
    },

    fingerprintTransactions(txs) {
        if (!txs?.length) return '0';
        return `${txs.length}:${txs[txs.length - 1].transaction_id || txs[txs.length - 1].timestamp}`;
    },

    fingerprintWallets(wallets) {
        if (!wallets?.length) return '0';
        return wallets.map(w => `${w.address}:${w.balance}`).join('|');
    },

    buildWalletIndex(wallets) {
        const map = new Map();
        (wallets || []).forEach(w => map.set(w.address, w));
        return map;
    },

    walletLabel(address, walletIndex) {
        const wallet = walletIndex?.get(address);
        return wallet?.name || UIHelpers.truncate(address, 6, 4);
    },

    setTextIfChanged(el, value) {
        if (!el) return;
        const next = String(value);
        if (el.textContent !== next) el.textContent = next;
    },

    renderChainStrip(blocks, maxVisible = AppConfig.defaults.chainPreviewMax || 15) {
        if (!blocks.length) return '';
        const tail = blocks.length > maxVisible ? blocks.slice(-maxVisible) : blocks;
        const hidden = blocks.length - tail.length;
        const prefix = hidden > 0
            ? `<span class="chain-ellipsis" title="${hidden} earlier blocks">+${hidden} …</span><span class="chain-connector" aria-hidden="true">→</span>`
            : '';

        return prefix + tail.map((block, idx) => {
            const globalIdx = hidden + idx;
            return UIHelpers.renderBlockChip(block, globalIdx, blocks.length);
        }).join('');
    },
};

window.RenderUtils = RenderUtils;
