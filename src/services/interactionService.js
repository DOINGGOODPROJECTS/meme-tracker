const Interaction = require('../models/Interaction');
const User = require('../models/User'); // Ajouté pour findByXHandle
const fetch = require('node-fetch');

class InteractionService {
    static async trackRetweets() {
        try {
            // Récupérer les interactions à vérifier (avec tweet_id)
            const interactions = await Interaction.findAllToCheck(); // Assume cette méthode existe
            if (!interactions.length) {
                console.log('Aucune interaction avec tweet_id à vérifier');
                return;
            }

            const tweetIds = interactions.map(i => i.tweet_id).join(',');
            console.log(`Requête API X pour tweetIds: ${tweetIds}`);

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
            console.log('Données API X reçues:', JSON.stringify(data));
            if (data.data) {
                for (const tweet of data.data) {
                    const interaction = interactions.find(i => i.tweet_id === tweet.id);
                    if (interaction && tweet.referenced_tweets) {
                        for (const refTweet of tweet.referenced_tweets) {
                            if (refTweet.type === 'retweet') {
                                const user = await User.findByXHandle(refTweet.author_id); // À adapter
                                if (user && interaction) {
                                    console.log(`Retweet détecté pour tweet ${tweet.id}, utilisateur ${user.x_handle}`);
                                    await Interaction.create(interaction.meme_id, user.id, 'retweet', 10, tweet.id);
                                    // Mise à jour explicite du solde (optionnel si géré dans Interaction.create)
                                    await User.updateMemecoinBalance(user.id, 10);
                                }
                            }
                        }
                    }
                    // Met à jour last_checked après vérification
                    await Interaction.updateLastChecked(interaction.id);
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