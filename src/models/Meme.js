const pool = require('../config/db');

class Meme {
    static async create(tweetId, imageUrl) {
        const [result] = await pool.query(
            'INSERT INTO memes (tweet_id, image_url) VALUES (?, ?)',
            [tweetId, imageUrl]
        );
        return result.insertId;
    }

    static async findByTweetId(tweetId) {
        const [rows] = await pool.query('SELECT * FROM memes WHERE tweet_id = ?', [tweetId]);
        return rows[0];
    }


    static async createFromDiscord(messageId, imageUrl, messageLink) {
        try {
            const [result] = await pool.query(
                'INSERT INTO memes (message_id, image_url, message_link, created_at) VALUES (?, ?, ?, NOW())',
                [messageId, imageUrl, messageLink]
            );
            return result.insertId;
        } catch (error) {
            console.error('Erreur lors de la création du mème depuis Discord:', error.message);
            throw error;
        }
    }

    static async findByMessageId(messageId) {
        try {
            const [rows] = await pool.query('SELECT * FROM memes WHERE message_id = ?', [messageId]);
            return rows[0];
        } catch (error) {
            console.error('Erreur lors de la recherche du mème par message ID:', error.message);
            throw error;
        }
    }


    static async updateTweetId(memeId, tweetId) {
        try {
            await pool.query('UPDATE memes SET tweet_id = ? WHERE id = ?', [tweetId, memeId]);
        } catch (error) {
            console.error('Erreur lors de la mise à jour du tweet_id:', error.message);
            throw error;
        }
    }
}

module.exports = Meme;