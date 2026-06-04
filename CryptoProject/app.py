"""
Flask web server for the blockchain visualizer.
Provides REST API endpoints and serves the web interface.
"""

from flask import Flask, jsonify, request, send_from_directory
from blockchain import Blockchain
from transaction import Wallet
import json
import os

app = Flask(__name__, static_folder='.')

# Global blockchain state
blockchain_instance = None
wallets_dict = {}
pending_transactions = []

def serialize_block(block):
    """Convert block to JSON-serializable format."""
    return {
        'index': block.index,
        'hash': block.hash,
        'previous_hash': block.previous_hash,
        'nonce': block.nonce,
        'timestamp': block.timestamp,
        'transactions': block.transactions,
        'mining_reward': getattr(blockchain_instance, 'mining_reward', 10) if blockchain_instance else 10
    }

@app.route('/')
def index():
    """Serve the main page."""
    return send_from_directory('.', 'index.html')

@app.route('/api/blockchain/init', methods=['POST'])
def init_blockchain():
    """Initialize a new blockchain."""
    global blockchain_instance, wallets_dict, pending_transactions
    
    try:
        data = request.json
        difficulty = data.get('difficulty', 2)
        
        # Create new blockchain
        blockchain_instance = Blockchain(difficulty=difficulty)
        
        # Create wallets
        wallets_dict = {
            'Alice': Wallet(),
            'Bob': Wallet(),
            'Charlie': Wallet(),
            'Diana': Wallet(),
            'Eve': Wallet()
        }
        
        pending_transactions = []
        
        # Serialize blockchain
        blockchain_data = [serialize_block(block) for block in blockchain_instance.chain]
        
        # Get wallet data
        wallets_data = {}
        for name, wallet in wallets_dict.items():
            address = wallet.get_public_key_string()
            wallets_data[name] = {
                'address': address,
                'balance': blockchain_instance.get_balance(address)
            }
        
        return jsonify({
            'success': True,
            'blockchain': blockchain_data,
            'wallets': wallets_data,
            'message': f'Blockchain created with difficulty {difficulty}'
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/transactions/add', methods=['POST'])
def add_transaction():
    """Add a transaction to pending pool."""
    global pending_transactions
    
    try:
        if not blockchain_instance:
            return jsonify({'success': False, 'error': 'Blockchain not initialized'}), 400
        
        data = request.json
        sender_name = data.get('sender')
        receiver_name = data.get('receiver')
        amount = data.get('amount', 0)
        
        if not sender_name or not receiver_name or amount <= 0:
            return jsonify({'success': False, 'error': 'Invalid transaction data'}), 400
        
        if sender_name not in wallets_dict or receiver_name not in wallets_dict:
            return jsonify({'success': False, 'error': 'Invalid wallet'}), 400
        
        # Create and sign transaction
        sender_wallet = wallets_dict[sender_name]
        receiver_address = wallets_dict[receiver_name].get_public_key_string()
        
        tx = sender_wallet.create_transaction(receiver_address, amount)
        blockchain_instance.add_transaction(tx)
        pending_transactions.append({
            'sender': sender_name,
            'receiver': receiver_name,
            'amount': amount
        })
        
        return jsonify({
            'success': True,
            'message': f'Transaction added: {sender_name} → {receiver_name}: {amount}',
            'pending_transactions': len(pending_transactions)
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/blocks/mine', methods=['POST'])
def mine_block():
    """Mine a new block."""
    global pending_transactions
    
    try:
        if not blockchain_instance:
            return jsonify({'success': False, 'error': 'Blockchain not initialized'}), 400
        
        data = request.json
        miner_name = data.get('miner', 'System')
        
        if miner_name not in wallets_dict:
            miner_name = list(wallets_dict.keys())[0]
        
        miner_wallet = wallets_dict[miner_name]
        miner_address = miner_wallet.get_public_key_string()
        
        # Mine the block
        success = blockchain_instance.mine_pending_transactions(miner_address)
        
        if not success:
            return jsonify({
                'success': False,
                'error': 'No pending transactions to mine'
            }), 400
        
        pending_transactions = []
        
        # Update wallet balances
        wallets_data = {}
        for name, wallet in wallets_dict.items():
            address = wallet.get_public_key_string()
            wallets_data[name] = {
                'address': address,
                'balance': blockchain_instance.get_balance(address)
            }
        
        # Serialize blockchain
        blockchain_data = [serialize_block(block) for block in blockchain_instance.chain]
        
        return jsonify({
            'success': True,
            'blockchain': blockchain_data,
            'wallets': wallets_data,
            'blockIndex': len(blockchain_instance.chain) - 1,
            'message': f'Block mined by {miner_name}!'
        })
    
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@app.route('/api/blockchain/validate', methods=['GET'])
def validate_blockchain():
    """Validate the blockchain."""
    try:
        if not blockchain_instance:
            return jsonify({'success': False, 'error': 'Blockchain not initialized'}), 400
        
        is_valid = blockchain_instance.is_chain_valid()
        
        return jsonify({
            'valid': is_valid,
            'length': len(blockchain_instance.chain),
            'pending': len(pending_transactions),
            'errors': [] if is_valid else ['Chain validation failed']
        })
    
    except Exception as e:
        return jsonify({
            'valid': False,
            'errors': [str(e)]
        }), 400

@app.route('/api/blockchain/state', methods=['GET'])
def get_blockchain_state():
    """Get current blockchain state."""
    try:
        if not blockchain_instance:
            return jsonify({
                'initialized': False,
                'blockchain': [],
                'wallets': {},
                'stats': {}
            })
        
        blockchain_data = [serialize_block(block) for block in blockchain_instance.chain]
        
        wallets_data = {}
        for name, wallet in wallets_dict.items():
            address = wallet.get_public_key_string()
            wallets_data[name] = {
                'address': address,
                'balance': blockchain_instance.get_balance(address)
            }
        
        stats = {
            'block_count': len(blockchain_instance.chain),
            'transaction_count': sum(len(b.transactions) for b in blockchain_instance.chain),
            'difficulty': blockchain_instance.difficulty,
            'pending_transactions': len(pending_transactions),
            'mining_reward': blockchain_instance.mining_reward
        }
        
        return jsonify({
            'initialized': True,
            'blockchain': blockchain_data,
            'wallets': wallets_data,
            'stats': stats
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/wallet/<wallet_name>/balance', methods=['GET'])
def get_wallet_balance(wallet_name):
    """Get balance for a specific wallet."""
    try:
        if wallet_name not in wallets_dict:
            return jsonify({'error': 'Wallet not found'}), 404
        
        if not blockchain_instance:
            return jsonify({'balance': 0})
        
        wallet = wallets_dict[wallet_name]
        address = wallet.get_public_key_string()
        balance = blockchain_instance.get_balance(address)
        
        return jsonify({
            'wallet': wallet_name,
            'address': address,
            'balance': balance
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/wallet/<wallet_name>/transactions', methods=['GET'])
def get_wallet_transactions(wallet_name):
    """Get transaction history for a wallet."""
    try:
        if wallet_name not in wallets_dict:
            return jsonify({'error': 'Wallet not found'}), 404
        
        if not blockchain_instance:
            return jsonify({'transactions': []})
        
        wallet = wallets_dict[wallet_name]
        address = wallet.get_public_key_string()
        history = blockchain_instance.get_transaction_history(address)
        
        return jsonify({
            'wallet': wallet_name,
            'address': address,
            'transactions': history,
            'count': len(history)
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get blockchain statistics."""
    try:
        if not blockchain_instance:
            return jsonify({
                'blocks': 0,
                'transactions': 0,
                'wallets': 0,
                'difficulty': 0
            })
        
        return jsonify({
            'blocks': len(blockchain_instance.chain),
            'transactions': sum(len(b.transactions) for b in blockchain_instance.chain),
            'wallets': len(wallets_dict),
            'difficulty': blockchain_instance.difficulty,
            'pending_transactions': len(pending_transactions),
            'mining_reward': blockchain_instance.mining_reward
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors."""
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors."""
    return jsonify({'error': 'Server error'}), 500

if __name__ == '__main__':
    print("\n" + "="*80)
    print("=====Blockchain Visualizer Web Server=====")
    print("="*80)
    print("\n Server starting on http://localhost:5000")
    print("Open your browser and navigate to http://localhost:5000")
    print("\nAPI Endpoints:")
    print("  POST   /api/blockchain/init           - Create new blockchain")
    print("  POST   /api/transactions/add          - Add transaction")
    print("  POST   /api/blocks/mine               - Mine a block")
    print("  GET    /api/blockchain/validate       - Validate chain")
    print("  GET    /api/blockchain/state          - Get blockchain state")
    print("  GET    /api/wallet/<name>/balance     - Get wallet balance")
    print("  GET    /api/wallet/<name>/transactions - Get wallet history")
    print("  GET    /api/stats                     - Get statistics")
    print("\n" + "="*80 + "\n")
    
    app.run(debug=True, host='localhost', port=5000)
