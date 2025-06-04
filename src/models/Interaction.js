const pool = require('../config/db');

class Interaction {
    static async create(memeId, userId, actionType, memecoinsEarned, tweetId = null) {
        try {
            const [result] = await pool.query(
                'INSERT INTO interactions (meme_id, user_id, action_type, memecoins_earned, tweet_id) VALUES (?, ?, ?, ?, ?)',
                [memeId, userId, actionType, memecoinsEarned, tweetId]
            );
            // Met à jour le solde de l'utilisateur
            await pool.query(
                'UPDATE users SET memecoin_balance = memecoin_balance + ? WHERE id = ?',
                [memecoinsEarned, userId]
            );
            return result.insertId;
        } catch (error) {
            console.error('Erreur lors de la création de l’interaction:', error.message);
            throw error;
        }
    }

    static async findByMemeId(memeId) {
        try {
            const [rows] = await pool.query('SELECT * FROM interactions WHERE meme_id = ?', [memeId]);
            return rows;
        } catch (error) {
            console.error('Erreur lors de la recherche des interactions:', error.message);
            throw error;
        }
    }
}

module.exports = Interaction;