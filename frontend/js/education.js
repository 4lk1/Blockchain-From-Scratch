/* Educational mode — structured concept explanations */

const EDUCATION_GROUPS = [
    { id: 'fundamentals', label: 'Fundamentals' },
    { id: 'structure', label: 'Chain structure' },
    { id: 'transactions', label: 'Transactions & wallets' },
    { id: 'consensus', label: 'Consensus & mining' },
    { id: 'network', label: 'Network & sync' },
];

const EDUCATION_CONCEPTS = [
    {
        id: 'blockchain',
        group: 'fundamentals',
        title: 'Blockchain',
        summary: 'A shared ledger made of linked blocks — many computers keep copies so no single party controls the history.',
        what: 'A blockchain is an ordered list of blocks. Each block holds a batch of data (often transactions) plus a cryptographic fingerprint called a hash. Blocks reference the hash of the block before them, forming a chain.',
        why: 'Traditional databases have one administrator who can change records. Blockchains spread copies across a network and use math (hashing + consensus rules) so everyone agrees on the same history without trusting a central authority.',
        how: 'New data is grouped into a block. The block is linked to the previous one via its hash, then broadcast to peers. Nodes check the rules (signatures, balances, proof-of-work) and append the block if valid. Your simulator stores this chain in memory and on disk as JSON.',
        where: 'Bitcoin, Ethereum, supply-chain tracking, voting pilots, and this educational simulator all use blockchain-style linked ledgers — though production systems add many more features.',
        advantages: [
            'Transparency — anyone with access can audit the chain.',
            'Tamper-evidence — changing old data breaks hash links.',
            'No single point of control when the network is decentralized.',
        ],
        limitations: [
            'Throughput is often lower than centralized databases.',
            'Energy use can be high with proof-of-work.',
            'Lost private keys mean lost access — there is no password reset.',
        ],
        diagram: `<svg viewBox="0 0 520 80" width="520" height="80" aria-hidden="true">
            <rect x="10" y="20" width="90" height="40" rx="6" fill="var(--surface)" stroke="var(--success)" stroke-width="1.5"/>
            <text x="55" y="45" text-anchor="middle" fill="var(--text-secondary)" font-size="11">Genesis</text>
            <line x1="100" y1="40" x2="130" y2="40" stroke="var(--accent)" stroke-width="2"/>
            <rect x="130" y="20" width="90" height="40" rx="6" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.5"/>
            <text x="175" y="45" text-anchor="middle" fill="var(--text-secondary)" font-size="11">Block 1</text>
            <line x1="220" y1="40" x2="250" y2="40" stroke="var(--accent)" stroke-width="2"/>
            <rect x="250" y="20" width="90" height="40" rx="6" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.5"/>
            <text x="295" y="45" text-anchor="middle" fill="var(--text-secondary)" font-size="11">Block 2</text>
            <line x1="340" y1="40" x2="370" y2="40" stroke="var(--accent)" stroke-width="2"/>
            <rect x="370" y="20" width="90" height="40" rx="6" fill="var(--surface)" stroke="var(--accent)" stroke-width="1.5"/>
            <text x="415" y="45" text-anchor="middle" fill="var(--text-secondary)" font-size="11">Block 3</text>
            <text x="260" y="72" text-anchor="middle" fill="var(--text-muted)" font-size="10">Each block stores the hash of its predecessor</text>
        </svg>`,
        demo: 'none',
        vizTopic: 'structure',
        exploreView: 'blocks',
    },
    {
        id: 'decentralization',
        group: 'fundamentals',
        title: 'Decentralization',
        summary: 'Many independent nodes share responsibility instead of one company running the ledger.',
        what: 'Decentralization means no single server or organization owns the canonical record. Peers hold copies, validate rules locally, and coordinate through a consensus protocol.',
        why: 'Central systems are convenient but create trust bottlenecks — outages, censorship, or insider edits affect everyone. Decentralization trades some efficiency for resilience and shared control.',
        how: 'Each node stores the chain, validates incoming blocks, and picks the best chain (usually the longest valid one). In this simulator, HTTP peers register their URLs and pull chains via `/network/sync`.',
        where: 'Public cryptocurrencies, federated social protocols, and distributed storage networks aim for decentralization. Many enterprise blockchains remain partially centralized for compliance.',
        advantages: [
            'Harder for one actor to silently rewrite history.',
            'Network can survive individual node failures.',
            'Open participation on public chains.',
        ],
        limitations: [
            'Coordination is slower than a single database.',
            'Disputes require protocol rules, not an admin panel.',
            'This simulator uses simple HTTP sync — not full peer-to-peer gossip.',
        ],
        diagram: `<svg viewBox="0 0 320 200" width="320" height="200" aria-hidden="true">
            <circle cx="160" cy="100" r="28" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
            <text x="160" y="104" text-anchor="middle" fill="var(--text-secondary)" font-size="10" font-weight="600">Node A</text>
            <circle cx="60" cy="50" r="22" fill="var(--surface)" stroke="var(--border)" stroke-width="1.5"/>
            <text x="60" y="54" text-anchor="middle" fill="var(--text-muted)" font-size="9">Peer</text>
            <circle cx="260" cy="50" r="22" fill="var(--surface)" stroke="var(--border)" stroke-width="1.5"/>
            <text x="260" y="54" text-anchor="middle" fill="var(--text-muted)" font-size="9">Peer</text>
            <circle cx="60" cy="150" r="22" fill="var(--surface)" stroke="var(--border)" stroke-width="1.5"/>
            <text x="60" y="154" text-anchor="middle" fill="var(--text-muted)" font-size="9">Peer</text>
            <circle cx="260" cy="150" r="22" fill="var(--surface)" stroke="var(--border)" stroke-width="1.5"/>
            <text x="260" y="154" text-anchor="middle" fill="var(--text-muted)" font-size="9">Peer</text>
            <line x1="82" y1="58" x2="132" y2="88" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/>
            <line x1="238" y1="58" x2="188" y2="88" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/>
            <line x1="82" y1="142" x2="132" y2="112" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/>
            <line x1="238" y1="142" x2="188" y2="112" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="4 3"/>
        </svg>`,
        demo: 'none',
        vizTopic: 'topology',
        exploreView: 'overview',
    },
    {
        id: 'immutability',
        group: 'fundamentals',
        title: 'Immutability',
        summary: 'Past records are extremely hard to change without redoing all the work that came after.',
        what: 'Immutability means committed blocks should not be silently edited. Hashes chain blocks together — alter one field and the block\'s hash changes, breaking the link to the next block.',
        why: 'Money and contracts need a reliable audit trail. If history were easy to rewrite, balances could be inflated or payments erased.',
        how: 'Validators recompute hashes and check links on every audit. An attacker must rebuild every subsequent block (and outpace honest miners) to replace history — expensive under proof-of-work.',
        where: 'Audit logs, timestamping services, and cryptocurrencies rely on tamper-evidence. Your Lab view includes a tamper demo that flips validation to invalid.',
        advantages: [
            'Strong auditability for regulators and users.',
            'Detects accidental corruption quickly.',
            'Deters casual data manipulation.',
        ],
        limitations: [
            'Not absolute — 51% attacks or key compromise can still harm the system.',
            'Private editable chains trade immutability for governance flexibility.',
            'Garbage in still means garbage out — immutability does not mean “truth.”',
        ],
        diagram: `<svg viewBox="0 0 400 90" width="400" height="90" aria-hidden="true">
            <rect x="20" y="25" width="100" height="40" rx="6" fill="var(--success-soft)" stroke="var(--success)"/>
            <text x="70" y="50" text-anchor="middle" fill="var(--text-secondary)" font-size="10">Valid chain</text>
            <text x="220" y="35" fill="var(--danger)" font-size="11" font-weight="600">Tamper block →</text>
            <rect x="260" y="25" width="100" height="40" rx="6" fill="var(--danger-soft)" stroke="var(--danger)"/>
            <text x="310" y="50" text-anchor="middle" fill="var(--text-secondary)" font-size="10">Broken link ✕</text>
        </svg>`,
        demo: 'hash-sensitivity',
        vizTopic: 'hashing',
        exploreView: 'lab',
    },
    {
        id: 'blocks',
        group: 'structure',
        title: 'Blocks',
        summary: 'Containers that bundle transactions with metadata and a proof that they follow the rules.',
        what: 'A block is a data structure with a header (index, timestamp, previous hash, nonce, difficulty, hash) and a body (transactions). Headers let nodes verify order and integrity quickly.',
        why: 'Batching transactions reduces overhead and creates clear checkpoints. Linking headers builds the chain.',
        how: 'Miners collect pending transactions, assemble a candidate block, search for a valid nonce, then broadcast it. Nodes validate signatures, balances, index continuity, and proof-of-work before accepting.',
        where: 'Every blockchain uses blocks or block-like structures (some systems use DAGs, but the idea is similar). Explore live blocks in the Blocks view.',
        advantages: [
            'Clear boundaries for validation and rewards.',
            'Efficient batch verification.',
            'Natural unit for sync (“give me blocks after height N”).',
        ],
        limitations: [
            'Block size caps can cause congestion.',
            'Fixed block times add latency vs instant settlement.',
        ],
        diagram: `<svg viewBox="0 0 280 140" width="280" height="140" aria-hidden="true">
            <rect x="40" y="10" width="200" height="50" rx="6" fill="var(--accent-soft)" stroke="var(--accent)"/>
            <text x="140" y="32" text-anchor="middle" fill="var(--text-secondary)" font-size="11" font-weight="600">Header</text>
            <text x="140" y="48" text-anchor="middle" fill="var(--text-muted)" font-size="9">index · prev_hash · nonce · hash</text>
            <rect x="40" y="70" width="200" height="60" rx="6" fill="var(--surface)" stroke="var(--border)"/>
            <text x="140" y="95" text-anchor="middle" fill="var(--text-secondary)" font-size="11" font-weight="600">Body</text>
            <text x="140" y="115" text-anchor="middle" fill="var(--text-muted)" font-size="9">transactions[]</text>
        </svg>`,
        demo: 'none',
        vizTopic: 'structure',
        exploreView: 'blocks',
    },
    {
        id: 'genesis',
        group: 'structure',
        title: 'Genesis Block',
        summary: 'The first block — it has no real predecessor, so its previous hash is a fixed placeholder.',
        what: 'The genesis block (block #0) bootstraps the chain. Its `previous_hash` is a constant string (often zeros), not the hash of an earlier block.',
        why: 'Every linked list needs a start. The genesis block gives all nodes the same anchor so they agree on the initial state.',
        how: 'The simulator creates genesis automatically on reset or first run. All later blocks must ultimately trace back to this hash.',
        where: 'Bitcoin’s genesis includes a famous newspaper headline in its coinbase message. Every network defines its own genesis parameters.',
        advantages: [
            'Shared starting point for all participants.',
            'Can encode initial allocations or configuration.',
        ],
        limitations: [
            'Genesis parameters must be trusted at join time.',
            'Changing genesis means a new network — not a live upgrade.',
        ],
        diagram: `<svg viewBox="0 0 300 70" width="300" height="70" aria-hidden="true">
            <rect x="90" y="15" width="120" height="40" rx="6" fill="var(--success-soft)" stroke="var(--success)" stroke-width="2"/>
            <text x="150" y="40" text-anchor="middle" fill="var(--text-secondary)" font-size="11">Genesis #0</text>
            <text x="150" y="62" text-anchor="middle" fill="var(--text-muted)" font-size="9">previous_hash = "0" (sentinel)</text>
        </svg>`,
        demo: 'none',
        vizTopic: 'genesis',
        exploreView: 'blocks',
    },
    {
        id: 'hashing',
        group: 'structure',
        title: 'Cryptographic Hashing',
        summary: 'One-way fingerprints — same input always gives the same output, but you cannot reverse it.',
        what: 'A hash function (SHA-256 here) maps any input to a fixed-length string. Tiny input changes produce completely different hashes.',
        why: 'Hashes compactly identify blocks and transactions, detect tampering, and power proof-of-work puzzles.',
        how: 'The simulator serializes block fields to JSON and runs SHA-256. Miners increment the nonce until the hash starts with enough zeros for the current difficulty.',
        where: 'Password storage (with salt), Git commit IDs, SSL certificates, and every major blockchain.',
        advantages: [
            'Fast to compute, impractical to invert.',
            'Collision-resistant for practical purposes.',
            'Deterministic — great for verification.',
        ],
        limitations: [
            'Not encryption — hashes hide nothing if the input space is small.',
            'Quantum research motivates future algorithm upgrades.',
        ],
        diagram: `<svg viewBox="0 0 360 70" width="360" height="70" aria-hidden="true">
            <rect x="10" y="20" width="100" height="30" rx="4" fill="var(--surface)" stroke="var(--border)"/>
            <text x="60" y="40" text-anchor="middle" fill="var(--text-secondary)" font-size="10">Input data</text>
            <text x="130" y="40" fill="var(--accent)" font-size="16">→</text>
            <rect x="150" y="15" width="80" height="40" rx="4" fill="var(--accent-soft)" stroke="var(--accent)"/>
            <text x="190" y="40" text-anchor="middle" fill="var(--text-secondary)" font-size="10">SHA-256</text>
            <text x="250" y="40" fill="var(--accent)" font-size="16">→</text>
            <rect x="270" y="20" width="80" height="30" rx="4" fill="var(--surface)" stroke="var(--border)"/>
            <text x="310" y="40" text-anchor="middle" fill="var(--text-muted)" font-size="9">64-char hex</text>
        </svg>`,
        demo: 'hash-input',
        vizTopic: 'hashing',
        exploreView: 'mining',
    },
    {
        id: 'merkle',
        group: 'structure',
        title: 'Merkle Trees',
        summary: 'A tree of hashes that summarizes all transactions in a block with one root hash.',
        what: 'Transactions are hashed, then paired and hashed again layer by layer until a single root remains. Any change to a leaf changes the root.',
        why: 'Light clients can verify a transaction is in a block without downloading every transaction — they only need a short proof path.',
        how: 'Bitcoin stores the Merkle root in the block header. This simulator hashes the full transaction list directly in the block hash for simplicity — the Visualize tab builds an educational Merkle tree from your live block data.',
        where: 'Bitcoin block headers, IPFS, certificate transparency logs, and many zero-knowledge systems.',
        advantages: [
            'Efficient membership proofs.',
            'Root commits to entire tx set in 32 bytes.',
            'Parallelizable tree construction.',
        ],
        limitations: [
            'Not needed for tiny blocks in teaching setups.',
            'Second-preimage attacks require careful leaf encoding (Bitcoin duplicates odd leaves).',
        ],
        diagram: `<svg viewBox="0 0 320 120" width="320" height="120" aria-hidden="true">
            <rect x="130" y="5" width="60" height="24" rx="4" fill="var(--accent-soft)" stroke="var(--accent)"/>
            <text x="160" y="21" text-anchor="middle" fill="var(--text-secondary)" font-size="9">Root</text>
            <line x1="160" y1="29" x2="100" y2="45" stroke="var(--border)"/>
            <line x1="160" y1="29" x2="220" y2="45" stroke="var(--border)"/>
            <rect x="70" y="45" width="60" height="24" rx="4" fill="var(--surface)" stroke="var(--border)"/>
            <text x="100" y="61" text-anchor="middle" fill="var(--text-muted)" font-size="9">H(AB)</text>
            <rect x="190" y="45" width="60" height="24" rx="4" fill="var(--surface)" stroke="var(--border)"/>
            <text x="220" y="61" text-anchor="middle" fill="var(--text-muted)" font-size="9">H(CD)</text>
            <rect x="20" y="85" width="40" height="22" rx="4" fill="var(--success-soft)" stroke="var(--success)"/>
            <text x="40" y="100" text-anchor="middle" fill="var(--text-muted)" font-size="8">Tx A</text>
            <rect x="80" y="85" width="40" height="22" rx="4" fill="var(--success-soft)" stroke="var(--success)"/>
            <text x="100" y="100" text-anchor="middle" fill="var(--text-muted)" font-size="8">Tx B</text>
            <rect x="190" y="85" width="40" height="22" rx="4" fill="var(--success-soft)" stroke="var(--success)"/>
            <text x="210" y="100" text-anchor="middle" fill="var(--text-muted)" font-size="8">Tx C</text>
            <rect x="250" y="85" width="40" height="22" rx="4" fill="var(--success-soft)" stroke="var(--success)"/>
            <text x="270" y="100" text-anchor="middle" fill="var(--text-muted)" font-size="8">Tx D</text>
        </svg>`,
        demo: 'merkle-mini',
        vizTopic: 'merkle',
        exploreView: 'blocks',
    },
    {
        id: 'transactions',
        group: 'transactions',
        title: 'Transactions',
        summary: 'Signed messages that move value or update state from one account to another.',
        what: 'A transaction records sender, receiver, amount, and a cryptographic signature proving the sender authorized it. Each transaction also gets a unique ID derived from its fields.',
        why: 'Blockchains need a standard way to express “Alice pays Bob 5 coins” that every node can verify the same way.',
        how: 'You create a transaction in the dashboard. The backend checks balance, signs with the sender’s private key, and places it in the mempool until a miner includes it in a block.',
        where: 'Payments, token transfers, smart-contract calls (on Ethereum), and supply-chain events.',
        advantages: [
            'Programmable rules (when extended with scripts/contracts).',
            'Public auditability on open ledgers.',
            'Atomic batching in a single block.',
        ],
        limitations: [
            'Fees and congestion on busy networks.',
            'Irreversible once deeply confirmed — scams are hard to undo.',
            'Privacy is limited on fully transparent chains.',
        ],
        diagram: `<svg viewBox="0 0 340 60" width="340" height="60" aria-hidden="true">
            <rect x="10" y="15" width="70" height="30" rx="4" fill="var(--surface)" stroke="var(--border)"/>
            <text x="45" y="35" text-anchor="middle" fill="var(--text-secondary)" font-size="9">Alice</text>
            <text x="95" y="35" fill="var(--accent)">— 5 coins →</text>
            <rect x="170" y="15" width="70" height="30" rx="4" fill="var(--surface)" stroke="var(--border)"/>
            <text x="205" y="35" text-anchor="middle" fill="var(--text-secondary)" font-size="9">Bob</text>
            <rect x="260" y="15" width="70" height="30" rx="4" fill="var(--accent-soft)" stroke="var(--accent)"/>
            <text x="295" y="35" text-anchor="middle" fill="var(--text-muted)" font-size="8">signature</text>
        </svg>`,
        demo: 'none',
        vizTopic: 'tx-lifecycle',
        exploreView: 'transactions',
    },
    {
        id: 'wallets',
        group: 'transactions',
        title: 'Wallets & Keys',
        summary: 'Key pairs that control funds — the address is public, the private key must stay secret.',
        what: 'A wallet holds an ECDSA key pair. The public key is hashed to produce an address others send coins to. The private key signs transactions.',
        why: 'Digital cash needs ownership. Keys replace account passwords with math — only the holder of the private key can spend.',
        how: 'Create wallets in the Wallets view. Balances are computed by scanning the chain for outputs to your address minus sends. Private keys are encrypted on disk with Fernet in this project.',
        where: 'Hardware wallets, browser extensions (MetaMask), mobile apps, and custodial exchanges (they hold keys for you).',
        advantages: [
            'Self-custody — you control funds without a bank.',
            'Keys work across compatible software.',
        ],
        limitations: [
            'Losing the private key loses funds permanently.',
            'Phishing and malware target key storage.',
            'This simulator stores keys server-side for teaching — not a production wallet model.',
        ],
        diagram: `<svg viewBox="0 0 300 80" width="300" height="80" aria-hidden="true">
            <rect x="20" y="20" width="110" height="40" rx="6" fill="var(--danger-soft)" stroke="var(--danger)"/>
            <text x="75" y="38" text-anchor="middle" fill="var(--text-secondary)" font-size="9" font-weight="600">Private key</text>
            <text x="75" y="52" text-anchor="middle" fill="var(--text-muted)" font-size="8">Never share</text>
            <text x="145" y="45" fill="var(--accent)">→ derive →</text>
            <rect x="190" y="20" width="90" height="40" rx="6" fill="var(--success-soft)" stroke="var(--success)"/>
            <text x="235" y="38" text-anchor="middle" fill="var(--text-secondary)" font-size="9" font-weight="600">Address</text>
            <text x="235" y="52" text-anchor="middle" fill="var(--text-muted)" font-size="8">Share freely</text>
        </svg>`,
        demo: 'none',
        vizTopic: 'signing',
        exploreView: 'wallets',
    },
    {
        id: 'signatures',
        group: 'transactions',
        title: 'Digital Signatures (ECDSA)',
        summary: 'Proof that the owner of a private key approved a specific message — without revealing the key.',
        what: 'ECDSA (Elliptic Curve Digital Signature Algorithm) produces a signature from a private key and message hash. Anyone with the public key can verify the match.',
        why: 'Transactions must be authorized. Signatures prevent strangers from spending your balance while letting nodes verify cheaply.',
        how: 'When you submit a transaction, the backend hashes the payload and signs with ECDSA secp256k1 (Bitcoin’s curve). Validators recompute and check that the public key matches the sender address.',
        where: 'Bitcoin, Ethereum externally owned accounts, TLS 1.3, secure email (S/MIME).',
        advantages: [
            'Non-repudiation — signer cannot plausibly deny approval.',
            'Public verification — no secret needed to audit.',
            'Compact compared to RSA at similar security levels.',
        ],
        limitations: [
            'Bad randomness during signing has leaked keys in real incidents.',
            'Quantum computers threaten elliptic-curve schemes long-term.',
            'No recovery if you sign a malicious contract.',
        ],
        diagram: `<svg viewBox="0 0 380 70" width="380" height="70" aria-hidden="true">
            <text x="30" y="40" fill="var(--text-secondary)" font-size="10">Tx hash + private key</text>
            <text x="175" y="40" fill="var(--accent)">→ sign →</text>
            <rect x="240" y="20" width="60" height="30" rx="4" fill="var(--accent-soft)" stroke="var(--accent)"/>
            <text x="270" y="40" text-anchor="middle" fill="var(--text-muted)" font-size="9">sig</text>
            <text x="320" y="40" fill="var(--success)">✓ verify</text>
        </svg>`,
        demo: 'sign-verify',
        vizTopic: 'signing',
        exploreView: 'transactions',
    },
    {
        id: 'mempool',
        group: 'transactions',
        title: 'Mempool',
        summary: 'The waiting room — valid transactions sit here until a miner picks them for the next block.',
        what: 'The mempool (memory pool) is a temporary queue of pending transactions each node maintains locally.',
        why: 'Blocks arrive on an interval. Transactions need somewhere to wait, be ordered by fee/priority, and be deduplicated.',
        how: 'This simulator validates signatures and balances, deduplicates by transaction ID, caps size at 500, and exposes pending txs via `/transactions`. Mining drains the pool into a new block.',
        where: 'Every full node on Bitcoin, Ethereum, and similar networks runs a mempool.',
        advantages: [
            'Smooths burst traffic between blocks.',
            'Allows fee markets — higher incentive, faster inclusion.',
        ],
        limitations: [
            'Mempools can diverge across nodes temporarily.',
            'Spam can fill the pool — needs limits and fees.',
            'Pending txs are not final until mined.',
        ],
        diagram: `<svg viewBox="0 0 320 70" width="320" height="70" aria-hidden="true">
            <rect x="20" y="15" width="180" height="40" rx="6" fill="var(--warning-soft)" stroke="var(--warning)" stroke-dasharray="6 4"/>
            <text x="110" y="40" text-anchor="middle" fill="var(--text-secondary)" font-size="10">Mempool (pending)</text>
            <text x="215" y="40" fill="var(--accent)">→ mine →</text>
            <rect x="250" y="20" width="50" height="30" rx="4" fill="var(--surface)" stroke="var(--accent)"/>
            <text x="275" y="40" text-anchor="middle" fill="var(--text-muted)" font-size="9">Block</text>
        </svg>`,
        demo: 'none',
        vizTopic: 'mempool',
        exploreView: 'transactions',
    },
    {
        id: 'mining',
        group: 'consensus',
        title: 'Mining & Proof of Work',
        summary: 'Computers compete to find a hash puzzle solution — winner gets to propose the next block.',
        what: 'Proof of Work (PoW) requires finding a nonce so the block hash meets a difficulty target (leading zeros). It costs CPU time, making spam expensive.',
        why: 'In open networks, anyone can propose blocks. PoW randomly selects who gets to propose next proportional to compute spent, making history expensive to rewrite.',
        how: 'Select a miner wallet, click Mine. The backend increments nonce, hashes, and checks the prefix until valid, then awards a coinbase reward and mempool transactions.',
        where: 'Bitcoin, Litecoin, early Ethereum (now proof-of-stake), and this simulator.',
        advantages: [
            'Simple security model — attack requires majority hash power.',
            'Permissionless block production.',
        ],
        limitations: [
            'High energy consumption at scale.',
            'Slow finality — wait for confirmations.',
            'Mining pools centralize hash power in practice.',
        ],
        diagram: `<svg viewBox="0 0 340 60" width="340" height="60" aria-hidden="true">
            <text x="20" y="38" fill="var(--text-secondary)" font-size="10">nonce = 0,1,2…</text>
            <text x="130" y="38" fill="var(--accent)">hash →</text>
            <text x="190" y="38" fill="var(--text-muted)" font-size="10">000…?</text>
            <rect x="240" y="18" width="90" height="28" rx="4" fill="var(--success-soft)" stroke="var(--success)"/>
            <text x="285" y="36" text-anchor="middle" fill="var(--text-secondary)" font-size="9">Valid!</text>
        </svg>`,
        demo: 'mining-nonce',
        vizTopic: 'mining',
        exploreView: 'mining',
    },
    {
        id: 'consensus',
        group: 'consensus',
        title: 'Consensus',
        summary: 'The rules everyone follows to agree on one shared history.',
        what: 'Consensus is the protocol that picks which chain version is official when nodes disagree — here, the longest valid proof-of-work chain wins.',
        why: 'Without agreement, Alice could spend the same coin on two forks. Consensus ensures one global ordering of transactions.',
        how: 'Nodes validate blocks independently (signatures, balances, PoW, index continuity). On sync, this simulator pulls peer chains and replaces local state if a longer valid chain exists.',
        where: 'Nakamoto consensus (PoW), Ethereum’s Gasper (PoS), PBFT in private chains.',
        advantages: [
            'Automated agreement without a central referee.',
            'Rules are code — transparent to audit.',
        ],
        limitations: [
            'Forks still happen temporarily under latency or attacks.',
            'Rule changes (hard forks) require social coordination.',
        ],
        diagram: `<svg viewBox="0 0 360 60" width="360" height="60" aria-hidden="true">
            <rect x="10" y="15" width="70" height="30" rx="4" fill="var(--surface)" stroke="var(--border)"/>
            <text x="45" y="35" text-anchor="middle" fill="var(--text-muted)" font-size="9">Propose</text>
            <text x="90" y="35" fill="var(--accent)">→</text>
            <rect x="100" y="15" width="70" height="30" rx="4" fill="var(--surface)" stroke="var(--border)"/>
            <text x="135" y="35" text-anchor="middle" fill="var(--text-muted)" font-size="9">Validate</text>
            <text x="180" y="35" fill="var(--accent)">→</text>
            <rect x="190" y="15" width="70" height="30" rx="4" fill="var(--surface)" stroke="var(--border)"/>
            <text x="225" y="35" text-anchor="middle" fill="var(--text-muted)" font-size="9">Append</text>
            <text x="270" y="35" fill="var(--accent)">→</text>
            <rect x="280" y="15" width="70" height="30" rx="4" fill="var(--accent-soft)" stroke="var(--accent)"/>
            <text x="315" y="35" text-anchor="middle" fill="var(--text-secondary)" font-size="9">Agree</text>
        </svg>`,
        demo: 'none',
        vizTopic: 'consensus',
        exploreView: 'overview',
    },
    {
        id: 'validation',
        group: 'consensus',
        title: 'Block Validation',
        summary: 'Every node re-checks the rules before trusting a block — trust, but verify.',
        what: 'Validation is the checklist: correct index, valid previous hash link, proof-of-work, valid signatures, no double-spends, and sane transaction structure.',
        why: 'Malicious or buggy blocks must be rejected locally even if a peer forwarded them.',
        how: 'Click Validate chain on Overview or call `/validate`. The backend walks the chain, recomputes hashes, verifies ECDSA signatures, and checks economic consistency.',
        where: 'All full nodes; light clients validate partially with Merkle proofs.',
        advantages: [
            'Each node enforces rules independently.',
            'Invalid blocks do not propagate far if peers are honest.',
        ],
        limitations: [
            'Validation cost grows with chain size and block complexity.',
            'Light clients trust full nodes for parts of the check.',
        ],
        diagram: `<svg viewBox="0 0 300 70" width="300" height="70" aria-hidden="true">
            <rect x="30" y="20" width="240" height="35" rx="6" fill="var(--surface)" stroke="var(--border)"/>
            <text x="150" y="42" text-anchor="middle" fill="var(--text-secondary)" font-size="10">✓ hash  ✓ PoW  ✓ sigs  ✓ balances</text>
        </svg>`,
        demo: 'none',
        vizTopic: 'consensus',
        exploreView: 'overview',
    },
    {
        id: 'peers',
        group: 'network',
        title: 'Peers & Network Topology',
        summary: 'Independent nodes connected together — each keeps a copy and talks to neighbors.',
        what: 'A peer is another node running the same protocol. Together they form a network topology (mesh, partial mesh, or star-like with relays).',
        why: 'Distribution requires communication channels to propagate blocks and transactions.',
        how: 'Register peer base URLs via the API. The Visualize topology view shows them orbiting this node. Production systems use gossip protocols; this simulator uses direct HTTP fetches.',
        where: 'Bitcoin’s P2P port 8333, Ethereum devp2p, private Hyperledger clusters.',
        advantages: [
            'Redundancy — many copies of data.',
            'Censorship resistance improves with more paths.',
        ],
        limitations: [
            'NAT and firewalls complicate inbound connections.',
            'Eclipse attacks can isolate a victim node.',
            'HTTP sync here is simplified for learning.',
        ],
        diagram: `<svg viewBox="0 0 200 200" width="200" height="200" aria-hidden="true">
            <circle cx="100" cy="100" r="24" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="2"/>
            <text x="100" y="104" text-anchor="middle" font-size="9" fill="var(--text-secondary)">You</text>
            <circle cx="100" cy="30" r="16" fill="var(--surface)" stroke="var(--border)"/>
            <circle cx="170" cy="100" r="16" fill="var(--surface)" stroke="var(--border)"/>
            <circle cx="100" cy="170" r="16" fill="var(--surface)" stroke="var(--border)"/>
            <circle cx="30" cy="100" r="16" fill="var(--surface)" stroke="var(--border)"/>
            <line x1="100" y1="76" x2="100" y2="46" stroke="var(--accent)" stroke-width="1.5"/>
            <line x1="124" y1="100" x2="154" y2="100" stroke="var(--accent)" stroke-width="1.5"/>
            <line x1="100" y1="124" x2="100" y2="154" stroke="var(--accent)" stroke-width="1.5"/>
            <line x1="76" y1="100" x2="46" y2="100" stroke="var(--accent)" stroke-width="1.5"/>
        </svg>`,
        demo: 'none',
        vizTopic: 'topology',
        exploreView: 'overview',
    },
    {
        id: 'sync',
        group: 'network',
        title: 'Peer Synchronization',
        summary: 'Catching up — downloading blocks from others until your chain matches the best available.',
        what: 'Sync is the process of comparing chain lengths and headers, then downloading missing blocks from peers.',
        why: 'New nodes start empty. Offline nodes fall behind. Sync brings everyone up to the same tip.',
        how: 'POST `/network/sync` asks each registered peer for its chain, validates candidates, and adopts the longest valid one. Analytics shows sync percentage vs peers.',
        where: 'Wallet “connecting to network”, blockchain explorers indexing history, mobile SPV wallets.',
        advantages: [
            'Nodes can join anytime without manual imports.',
            'Self-healing after outages.',
        ],
        limitations: [
            'Initial sync can take hours on large chains.',
            'Fake peers can waste bandwidth — need peer diversity.',
        ],
        diagram: `<svg viewBox="0 0 340 50" width="340" height="50" aria-hidden="true">
            <text x="20" y="32" fill="var(--text-secondary)" font-size="10">Peer chain (longer)</text>
            <text x="180" y="32" fill="var(--accent)">→ adopt →</text>
            <text x="260" y="32" fill="var(--text-secondary)" font-size="10">Local node</text>
        </svg>`,
        demo: 'none',
        vizTopic: 'sync',
        exploreView: 'analytics',
    },
    {
        id: 'forks',
        group: 'network',
        title: 'Forks & Chain Reorganization',
        summary: 'When two valid branches exist temporarily — the network eventually picks one.',
        what: 'A fork is a split in the chain — often from two miners finding blocks at once, or an attack. A reorg switches your tip to a different branch.',
        why: 'Network latency means perfect simultaneity is impossible. Rules must resolve conflicts fairly.',
        how: 'Honest nodes follow the longest valid chain. The Lab’s 51% attack demo builds a longer private chain to demonstrate reorg. Visualize → Fork resolution animates the switch.',
        where: 'Accidental stale blocks in Bitcoin (~1% orphan rate historically), intentional hard forks (Ethereum / Ethereum Classic).',
        advantages: [
            'Self-recovery from split views without manual intervention.',
            'Clear rule: more accumulated work wins (PoW).',
        ],
        limitations: [
            'Reorgs undo recent confirmations — exchanges wait for depth.',
            'Deep reorgs indicate attack or catastrophic partition.',
        ],
        diagram: `<svg viewBox="0 0 360 90" width="360" height="90" aria-hidden="true">
            <rect x="10" y="35" width="40" height="20" rx="3" fill="var(--accent)" opacity="0.7"/>
            <rect x="55" y="35" width="40" height="20" rx="3" fill="var(--accent)" opacity="0.7"/>
            <rect x="100" y="35" width="40" height="20" rx="3" fill="var(--accent)" opacity="0.7"/>
            <rect x="145" y="20" width="40" height="20" rx="3" fill="var(--success)" opacity="0.8"/>
            <rect x="145" y="50" width="40" height="20" rx="3" fill="var(--danger)" opacity="0.8"/>
            <rect x="190" y="20" width="40" height="20" rx="3" fill="var(--success)" opacity="0.8"/>
            <rect x="190" y="50" width="40" height="20" rx="3" fill="var(--danger)" opacity="0.8"/>
            <rect x="235" y="50" width="40" height="20" rx="3" fill="var(--danger)" opacity="0.8"/>
            <text x="280" y="33" fill="var(--success)" font-size="9">Honest</text>
            <text x="280" y="63" fill="var(--danger)" font-size="9">Longer fork wins</text>
        </svg>`,
        demo: 'none',
        vizTopic: 'fork',
        exploreView: 'lab',
    },
];

const Education = {
    topic: 'blockchain',
    miningInterval: null,

    init() {
        this.renderNav();
        this.bindGlobalLinks();
        document.getElementById('eduContent')?.addEventListener('click', (e) => this.handleDemoClick(e));
    },

    bindGlobalLinks() {
        document.querySelectorAll('[data-learn-topic]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const topic = el.dataset.learnTopic;
                NavManager.show(`learn/${topic}`);
            });
        });
    },

    onViewActive(topic) {
        if (topic && this.findConcept(topic)) {
            this.topic = topic;
        }
        this.renderNav();
        this.renderConcept(this.topic);
    },

    findConcept(id) {
        return EDUCATION_CONCEPTS.find(c => c.id === id);
    },

    renderNav() {
        const nav = document.getElementById('eduTopicList');
        if (!nav) return;

        nav.innerHTML = EDUCATION_GROUPS.map(group => {
            const items = EDUCATION_CONCEPTS.filter(c => c.group === group.id);
            return `
                <div class="edu-nav__group">
                    <span class="edu-nav__label">${group.label}</span>
                    ${items.map(c => `
                        <button type="button" class="edu-nav__link ${c.id === this.topic ? 'edu-nav__link--active' : ''}"
                            data-edu-topic="${c.id}"
                            ${c.id === this.topic ? 'aria-current="true"' : ''}>${c.title}</button>
                    `).join('')}
                </div>
            `;
        }).join('');

        nav.querySelectorAll('[data-edu-topic]').forEach(btn => {
            btn.addEventListener('click', () => {
                NavManager.show(`learn/${btn.dataset.eduTopic}`);
            });
        });

        Accessibility?.refreshRovingLists();
    },

    section(label, letter, body, extraClass = '') {
        const content = Array.isArray(body)
            ? `<ul>${body.map(li => `<li>${li}</li>`).join('')}</ul>`
            : `<p>${body}</p>`;

        return `
            <section class="edu-section ${extraClass}">
                <h3 class="edu-section__label"><span>${letter}</span> ${label}</h3>
                ${content}
            </section>
        `;
    },

    renderConcept(id) {
        const concept = this.findConcept(id);
        const container = document.getElementById('eduContent');
        if (!concept || !container) return;

        this.stopMiningDemo();

        container.innerHTML = `
            <article class="edu-article card">
                <div class="card__body">
                    <header class="edu-header">
                        <span class="edu-chip">${EDUCATION_GROUPS.find(g => g.id === concept.group)?.label || 'Concept'}</span>
                        <h2 class="edu-header__title">${concept.title}</h2>
                        <p class="edu-header__summary">${concept.summary}</p>
                    </header>

                    <div class="edu-diagram">
                        ${concept.diagram}
                        <p class="edu-diagram__caption">Diagram — ${concept.title}</p>
                    </div>

                    <div class="edu-grid">
                        ${this.section('What it is', '1', concept.what)}
                        ${this.section('Why it exists', '2', concept.why)}
                        ${this.section('How it works', '3', concept.how)}
                        ${this.section('Where it is used', '4', concept.where)}
                        ${this.section('Advantages', '+', concept.advantages, 'edu-section--advantages')}
                        ${this.section('Limitations', '−', concept.limitations, 'edu-section--limitations')}
                    </div>

                    ${this.renderDemo(concept)}

                    <div class="edu-actions">
                        ${concept.vizTopic ? `<button type="button" class="btn btn--primary btn--sm" data-edu-viz="${concept.vizTopic}">Open interactive visualization</button>` : ''}
                        ${concept.exploreView ? `<button type="button" class="btn btn--secondary btn--sm" data-edu-view="${concept.exploreView}">Explore in dashboard</button>` : ''}
                    </div>
                </div>
            </article>
        `;

        container.querySelector('[data-edu-viz]')?.addEventListener('click', (e) => {
            const vizTopic = e.currentTarget.dataset.eduViz;
            NavManager.show('visualize');
            if (window.Visualizations) {
                Visualizations.showTopic(vizTopic);
            }
        });

        container.querySelector('[data-edu-view]')?.addEventListener('click', (e) => {
            NavManager.show(e.currentTarget.dataset.eduView);
        });
    },

    renderDemo(concept) {
        const demos = {
            'hash-input': `
                <div class="edu-demo" data-demo="hash-input">
                    <h4 class="edu-demo__title">Try it — hash any text</h4>
                    <p class="edu-demo__desc">Type a message and see its SHA-256 fingerprint. Same input always yields the same hash.</p>
                    <div class="edu-demo__row">
                        <div class="field" style="flex:1;min-width:200px">
                            <label for="eduHashInput">Input</label>
                            <input type="text" id="eduHashInput" class="input" value="Hello, blockchain!" placeholder="Enter text…">
                        </div>
                        <button type="button" class="btn btn--primary btn--sm" data-demo-action="hash-input">Compute hash</button>
                    </div>
                    <div class="edu-demo__output" id="eduHashOutput">Click compute to see the hash</div>
                </div>`,
            'hash-sensitivity': `
                <div class="edu-demo" data-demo="hash-sensitivity">
                    <h4 class="edu-demo__title">Try it — avalanche effect</h4>
                    <p class="edu-demo__desc">Change one character and watch the hash change completely.</p>
                    <div class="edu-demo__row">
                        <div class="field" style="flex:1;min-width:200px">
                            <label for="eduSensitiveInput">Message</label>
                            <input type="text" id="eduSensitiveInput" class="input" value="Block #1 pays Alice 10 coins">
                        </div>
                        <button type="button" class="btn btn--secondary btn--sm" data-demo-action="hash-flip">Flip last char</button>
                        <button type="button" class="btn btn--primary btn--sm" data-demo-action="hash-input-sensitive">Hash it</button>
                    </div>
                    <div class="edu-demo__output" id="eduSensitiveOutput">—</div>
                </div>`,
            'mining-nonce': `
                <div class="edu-demo" data-demo="mining-nonce">
                    <h4 class="edu-demo__title">Try it — find a valid nonce</h4>
                    <p class="edu-demo__desc">Searches for a hash with 3 leading zeros (same difficulty as this simulator).</p>
                    <div class="edu-demo__row">
                        <button type="button" class="btn btn--primary btn--sm" data-demo-action="mining-start">Start search</button>
                        <button type="button" class="btn btn--secondary btn--sm" data-demo-action="mining-stop">Stop</button>
                    </div>
                    <div class="edu-demo__output">Nonce: <span id="eduMiningNonce">0</span></div>
                    <div class="edu-demo__output" id="eduMiningHash" style="margin-top:0.5rem">—</div>
                </div>`,
            'merkle-mini': `
                <div class="edu-demo" data-demo="merkle-mini">
                    <h4 class="edu-demo__title">Try it — build a mini Merkle root</h4>
                    <p class="edu-demo__desc">Enter 2–4 labels (comma-separated). We hash pairs up to a root.</p>
                    <div class="edu-demo__row">
                        <div class="field" style="flex:1;min-width:200px">
                            <label for="eduMerkleInput">Leaves</label>
                            <input type="text" id="eduMerkleInput" class="input" value="Alice,Bob,Carol,Dave">
                        </div>
                        <button type="button" class="btn btn--primary btn--sm" data-demo-action="merkle-build">Build tree</button>
                    </div>
                    <div class="edu-demo__output" id="eduMerkleOutput">—</div>
                </div>`,
            'sign-verify': `
                <div class="edu-demo" data-demo="sign-verify">
                    <h4 class="edu-demo__title">Try it — message integrity check</h4>
                    <p class="edu-demo__desc">Simulates signing: hash a message, then verify it matches after transmission.</p>
                    <div class="edu-demo__row">
                        <div class="field" style="flex:1;min-width:200px">
                            <label for="eduSignInput">Transaction message</label>
                            <input type="text" id="eduSignInput" class="input" value="Alice sends 5 to Bob">
                        </div>
                        <button type="button" class="btn btn--primary btn--sm" data-demo-action="sign-demo">Sign &amp; verify</button>
                    </div>
                    <div class="edu-demo__output" id="eduSignOutput">—</div>
                </div>`,
        };

        if (concept.demo === 'none' || !demos[concept.demo]) return '';
        return demos[concept.demo];
    },

    handleDemoClick(e) {
        const action = e.target.closest('[data-demo-action]')?.dataset.demoAction;
        if (!action) return;

        if (action === 'hash-input') this.demoHashInput('eduHashInput', 'eduHashOutput');
        if (action === 'hash-input-sensitive') this.demoHashInput('eduSensitiveInput', 'eduSensitiveOutput');
        if (action === 'hash-flip') this.demoHashFlip();
        if (action === 'mining-start') this.startMiningDemo();
        if (action === 'mining-stop') this.stopMiningDemo();
        if (action === 'merkle-build') this.demoMerkle();
        if (action === 'sign-demo') this.demoSignVerify();
    },

    async sha256(text) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async demoHashInput(inputId, outputId) {
        const input = document.getElementById(inputId);
        const output = document.getElementById(outputId);
        if (!input || !output) return;
        output.textContent = await this.sha256(input.value);
    },

    demoHashFlip() {
        const input = document.getElementById('eduSensitiveInput');
        if (!input || !input.value.length) return;
        const chars = input.value.split('');
        const last = chars.pop();
        chars.push(last === 's' ? 'z' : 's');
        input.value = chars.join('');
    },

    async demoMerkle() {
        const input = document.getElementById('eduMerkleInput');
        const output = document.getElementById('eduMerkleOutput');
        if (!input || !output) return;

        let level = input.value.split(',').map(s => s.trim()).filter(Boolean);
        if (!level.length) {
            output.textContent = 'Enter at least one leaf.';
            return;
        }

        const lines = [`Leaves: ${level.join(', ')}`];
        while (level.length > 1) {
            const next = [];
            for (let i = 0; i < level.length; i += 2) {
                const left = level[i];
                const right = level[i + 1] || left;
                const combined = await this.sha256(left + right);
                next.push(combined.slice(0, 8));
            }
            lines.push(`Level → ${next.join(' · ')}`);
            level = next;
        }
        lines.push(`Root: ${level[0]}`);
        output.innerHTML = lines.join('<br>');
    },

    async demoSignVerify() {
        const input = document.getElementById('eduSignInput');
        const output = document.getElementById('eduSignOutput');
        if (!input || !output) return;

        const message = input.value;
        const hash = await this.sha256(message);
        const tampered = message.replace(/\d+/, '999');
        const badHash = await this.sha256(tampered);

        output.innerHTML = `
            Message hash: <strong>${hash.slice(0, 24)}…</strong><br>
            Signature covers this hash (ECDSA in production).<br>
            After tamper "${tampered}": hash <strong>${badHash.slice(0, 24)}…</strong> — verification would <span style="color:var(--danger)">fail ✕</span>
        `;
    },

    startMiningDemo() {
        this.stopMiningDemo();
        const nonceEl = document.getElementById('eduMiningNonce');
        const hashEl = document.getElementById('eduMiningHash');
        let nonce = 0;
        const difficulty = 3;

        const tick = async () => {
            nonce += 1;
            const payload = `edu-demo|${nonce}`;
            const hash = await this.sha256(payload);
            if (nonceEl) nonceEl.textContent = nonce.toLocaleString();
            if (hashEl) {
                hashEl.textContent = hash;
                if (hash.startsWith('0'.repeat(difficulty))) {
                    hashEl.style.color = 'var(--success)';
                    this.stopMiningDemo();
                    Toast.show(`Valid hash at nonce ${nonce}`, 'success');
                }
            }
        };

        this.miningInterval = setInterval(tick, 30);
        tick();
    },

    stopMiningDemo() {
        if (this.miningInterval) {
            clearInterval(this.miningInterval);
            this.miningInterval = null;
        }
    },

    goToConcept(id) {
        NavManager.show(`learn/${id}`);
    },
};

window.Education = Education;
