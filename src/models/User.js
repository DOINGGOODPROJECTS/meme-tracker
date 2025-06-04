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

    static async updateMemecoinBalance(userId, memecoinsEarned) {
        try {
            const [result] = await pool.query(
                'UPDATE users SET memecoin_balance = memecoin_balance + ? WHERE id = ?',
                [memecoinsEarned, userId]
            );
            if (result.affectedRows === 0) {
                console.error(`Aucun utilisateur trouvé avec l’ID ${userId}`);
                throw new Error('Utilisateur non trouvé');
            }
            console.log(`Solde mis à jour pour l'utilisateur ID ${userId} : ${memecoinsEarned} mèmecoins ajoutés`);
            return result.affectedRows;
        } catch (error) {
            console.error('Erreur lors de la mise à jour du solde de mèmecoins:', error.message);
            throw error;
        }
    }
}

module.exports = User;