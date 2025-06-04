const { Client } = require('discord.js');
const MemeService = require('./memeService');
const InteractionService = require('./interactionService');
const User = require('../models/User');

const client = new Client({ intents: ['GUILDS', 'GUILD_MESSAGES', 'MESSAGE_CONTENT'] });

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    setInterval(() => InteractionService.trackRetweets(), 300000); // Vérifie toutes les 5 minutes
});

client.on('messageCreate', async (message) => {
    console.log(`Message reçu: ${message.content} de ${message.author.tag} dans le salon ${message.channel.id}`);

    if (message.channel.id !== process.env.DISCORD_CHANNEL_ID) {
        console.log(`Message ignoré: Mauvais salon`);
        return;
    }

    let imageUrl = null;
    let messageLink = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;

    if (message.attachments.size > 0) {
        imageUrl = message.attachments.first().url;
    } else if (message.embeds.length > 0 && message.embeds[0].image) {
        imageUrl = message.embeds[0].image.url;
    }

    if (imageUrl) {
        console.log(`Nouvelle image détectée - URL: ${imageUrl}`);
        try {
            await MemeService.createFromDiscord(message.id, imageUrl, messageLink);
        } catch (error) {
            console.error('Erreur lors de l’enregistrement du mème:', error.message);
        }
    }

    if (!message.author.bot && message.content.toLowerCase().includes('tweet id:')) {
        console.log('Message "Tweet Id" détecté:', message.content);
        const tweetIdMatch = message.content.match(/tweet id:\s*(\d+)/i);
        if (tweetIdMatch && tweetIdMatch[1]) {
            const tweetId = tweetIdMatch[1];
            console.log('Tweet ID extrait:', tweetId);
            const recentMemes = await Meme.findAll();
            const latestMemeWithoutTweetId = recentMemes
                .filter(m => m.message_link && m.message_link.includes(message.channel.id) && !m.tweet_id)
                .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

            if (latestMemeWithoutTweetId) {
                try {
                    await MemeService.updateTweetId(latestMemeWithoutTweetId.id, tweetId);
                    message.reply(`Tweet ID ${tweetId} associé avec succès !`);
                } catch (error) {
                    console.error('Erreur lors de la mise à jour du tweet_id:', error.message);
                    message.reply('Erreur lors de l’association du Tweet ID.');
                }
            } else {
                message.reply('Aucun mème récent sans tweet_id à associer.');
            }
        } else {
            message.reply('Format invalide. Utilise "Tweet Id: 123456789".');
        }
    }

    if (!message.author.bot && !message.content.toLowerCase().includes('tweet id:')) {
        const args = message.content.split(' ');
        const command = args[0].toLowerCase();

        if (command === '!link') {
            const xHandle = args[1];
            if (!xHandle) return message.reply('Veuillez fournir votre pseudo X (ex. : !link @username).');

            try {
                const user = await User.findByDiscordId(message.author.id);
                if (user) return message.reply('Votre compte est déjà lié.');
                await User.create(message.author.id, xHandle);
                message.reply(`Compte X ${xHandle} lié avec succès !`);
            } catch (error) {
                console.error('Erreur lors du traitement de !link:', error.message);
                message.reply('Une erreur est survenue.');
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);

module.exports = client;