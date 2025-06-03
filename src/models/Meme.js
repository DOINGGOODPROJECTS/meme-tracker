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
}

module.exports = Meme;