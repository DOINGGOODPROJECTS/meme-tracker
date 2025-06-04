const Meme = require('../models/Meme');

class MemeService {
    static async createFromDiscord(messageId, imageUrl, messageLink) {
        try {
            const existingMeme = await Meme.findByMessageId(messageId);
            if (existingMeme) return existingMeme.id;
            const memeId = await Meme.createFromDiscord(messageId, imageUrl, messageLink);
            return memeId;
        } catch (error) {
            console.error('Erreur dans MemeService.createFromDiscord:', error.message);
            throw error;
        }
    }
}

module.exports = MemeService;