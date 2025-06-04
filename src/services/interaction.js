const Interaction = require('../models/Interaction');
const fetch = require('node-fetch');

class Interaction {
    static async trackRetweets() {
        try {
            const memes = await Meme.findAll();
            const tweetIds = memes
                .filter(m => m.tweet_id)
                .map(m => m.tweet_id)
                .join(',');

            if (!tweetIds) {
                console.log('Aucun tweet_id à vérifier');
                return;
            }

            const response = await fetch(
                `https://api.x.com/2/tweets?ids=${tweetIds}&expansions=referenced_tweets.id`,
                {
                    headers: {
                        Authorization: `Bearer ${process.env.X_BEARER_TOKEN}`,
                    },
                }
            );

            if (response.status === 429) {
                const resetTime = parseInt(response.headers.get('x-rate-limit-reset')) * 1000;
                const currentTime = Date.now();
                const waitTime = resetTime - currentTime + 1000;
                console.log(`Limite de requêtes atteinte. Attente de ${waitTime / 1000} secondes...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return;
            }

            if (!response.ok) {
                console.error(`Erreur API X: ${response.status} ${response.statusText}`);
                return;
            }

            const data = await response.json();
            if (data.data) {
                for (const tweet of data.data) {
                    if (tweet.referenced_tweets) {
                        for (const refTweet of tweet.referenced_tweets) {
                            if (refTweet.type === 'retweet') {
                                const meme = memes.find(m => m.tweet_id === tweet.id);
                                const user = await User.findByXHandle(refTweet.author_id); // À adapter
                                if (user && meme) {
                                    await Interaction.create(meme.id, user.id, 'retweet', 10, tweet.id);
                                }
                            }
                        }
                    }
                }
            } else {
                console.log('Aucune donnée de tweet trouvée');
            }
        } catch (error) {
            console.error('Erreur dans InteractionService.trackRetweets:', error.message);
        }
    }
}

module.exports = InteractionService;