const fetch = require('node-fetch');
const TweetInteraction = require('../models/TweetInteraction');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const startTrackingRetweets = () => {
    setInterval(async () => {
        console.log('Vérification des retweets...');
        try {
            const interactions = await TweetInteraction.findAllToCheck();
            if (!interactions.length) {
                console.log('Aucun tweet à vérifier');
                return;
            }

            const tweetIds = interactions.map(i => i.tweet_id).join(',');
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
                console.log(`Limite de requêtes atteinte. Attente de ${waitTime / 1000} secondes avant de réessayer...`);
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
                    const interaction = interactions.find(i => i.tweet_id === tweet.id);
                    if (tweet.referenced_tweets) {
                        for (const refTweet of tweet.referenced_tweets) {
                            if (refTweet.type === 'retweet') {
                                const user = await User.findByXHandle(refTweet.author_id); // À adapter
                                if (user) {
                                    await Transaction.create(user.id, interaction.meme_id, 'retweet', 10);
                                }
                            }
                        }
                    }
                    await TweetInteraction.updateLastChecked(interaction.id);
                }
            } else {
                console.log('Aucune donnée de tweet trouvée');
            }
        } catch (error) {
            console.error('Erreur lors du traçage des retweets:', error.message);
        }
    }, 900000); // Vérifie toutes les 15 minutes
};

module.exports = { startTrackingRetweets };