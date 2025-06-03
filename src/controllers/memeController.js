const Meme = require('../models/Meme');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

class MemeController {
    static async addMeme(req, res) {
        const { tweetId, imageUrl } = req.body;
        try {
            const memeId = await Meme.create(tweetId, imageUrl);
            res.status(201).json({ memeId });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = MemeController;