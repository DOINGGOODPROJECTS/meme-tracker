const pool = require('../config/db');

class TweetInteraction {
    static async create(tweetId, memeId) {
        try {
            const [result] = await pool.query(
                'INSERT INTO tweet_interactions (tweet_id, meme_id) VALUES (?, ?)',
                [tweetId, memeId]
            );
            return result.insertId;
        } catch (error) {
            console.error('Erreur lors de la création de tweet_interaction:', error.message);
            throw error;
        }
    }

    static async findAllToCheck() {
        try {
            const [rows] = await pool.query(
                'SELECT id, tweet_id, meme_id ' +
                'FROM tweet_interactions ' +
                'WHERE (last_checked IS NULL OR last_checked < NOW() - INTERVAL 1 HOUR)'
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la récupération des tweet_interactions:', error.message);
            throw error;
        }
    }

    static async updateLastChecked(id) {
        try {
            await pool.query('UPDATE tweet_interactions SET last_checked = NOW() WHERE id = ?', [id]);
        } catch (error) {
            console.error('Erreur lors de la mise à jour de last_checked:', error.message);
            throw error;
        }
    }
}

module.exports = TweetInteraction;