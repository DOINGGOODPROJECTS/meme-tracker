const pool = require('../config/db');

class User {
    static async create(discordId, xHandle) {
        const [result] = await pool.query(
            'INSERT INTO users (discord_id, x_handle) VALUES (?, ?)',
            [discordId, xHandle]
        );
        return result.insertId;
    }

    static async findByDiscordId(discordId) {
        const [rows] = await pool.query('SELECT * FROM users WHERE discord_id = ?', [discordId]);
        return rows[0];
    }

    static async updateBalance(userId, amount) {
        await pool.query('UPDATE users SET memecoin_balance = memecoin_balance + ? WHERE id = ?', [amount, userId]);
    }

    static async findByXHandle(xHandle) {
        try {
            const [rows] = await pool.query('SELECT * FROM users WHERE x_handle = ?', [xHandle]);
            return rows[0];
        } catch (error) {
            console.error('Erreur lors de la recherche de l’utilisateur par x_handle:', error.message);
            throw error;
        }
    }
}

module.exports = User;