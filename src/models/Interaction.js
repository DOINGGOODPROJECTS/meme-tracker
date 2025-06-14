const pool = require('../config/db');
const User = require('./User'); // Pour updateMemecoinBalance

class Interaction {
    static async create(memeId, userId, actionType, memecoinsEarned, tweetId = null) {
        try {
            const [result] = await pool.query(
                'INSERT INTO interactions (meme_id, user_id, action_type, memecoins_earned, tweet_id) VALUES (?, ?, ?, ?, ?)',
                [memeId, userId, actionType, memecoinsEarned, tweetId]
            );
            await User.updateMemecoinBalance(userId, memecoinsEarned); // Mise à jour du solde
            return result.insertId;
        } catch (error) {
            console.error('Erreur lors de la création de l’interaction:', error.message);
            throw error;
        }
    }

    static async findByMemeId(memeId) {
        try {
            const [rows] = await pool.query('SELECT * FROM interactions WHERE meme_id = ? LIMIT 1', [memeId]);
            return rows[0];
        } catch (error) {
            console.error('Erreur lors de la recherche de l’interaction par meme_id:', error.message);
            throw error;
        }
    }

    static async findAllToCheck() {
        try {
            const [rows] = await pool.query(
                'SELECT * FROM interactions WHERE last_checked IS NULL OR last_checked < NOW() - INTERVAL 1 HOUR'
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la recherche des interactions à vérifier:', error.message);
            throw error;
        }
    }

    static async updateLastChecked(interactionId) {
        try {
            await pool.query(
                'UPDATE interactions SET last_checked = NOW() WHERE id = ?',
                [interactionId]
            );
            console.log(`Interaction ${interactionId} marquée comme vérifiée`);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de last_checked:', error.message);
            throw error;
        }
    }

    static async updateTweetId(interactionId, tweetId) {
        try {
            const [result] = await pool.query(
                'UPDATE interactions SET tweet_id = ? WHERE id = ?',
                [tweetId, interactionId]
            );
            if (result.affectedRows === 0) {
                console.error('Aucune interaction trouvée avec l’ID:', interactionId);
                throw new Error('Interaction non trouvée');
            }
            console.log(`Tweet ID ${tweetId} associé à l’interaction ID ${interactionId}`);
            return true;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du tweet_id dans interactions:', error.message);
            throw error;
        }
    }
}

module.exports = Interaction;