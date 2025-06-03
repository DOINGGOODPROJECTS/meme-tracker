const pool = require('../config/db');

class Transaction {
    static async create(userId, memeId, actionType, memecoinsEarned) {
        const [result] = await pool.query(
            'INSERT INTO transactions (user_id, meme_id, action_type, memecoins_earned) VALUES (?, ?, ?, ?)',
            [userId, memeId, actionType, memecoinsEarned]
        );
        return result.insertId;
    }
}

module.exports = Transaction;