const { Client, GatewayIntentBits } = require('discord.js');
const MemeService = require('./memeService');
const InteractionService = require('./interactionService');
const User = require('../models/User');
const Meme = require('../models/Meme');
const Interaction = require('../models/Interaction');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log('Démarrage du tracking des retweets toutes les 5 minutes...');
    setInterval(() => InteractionService.trackRetweets(), 300000); // 5 minutes
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
        const match = message.content.match(/Tweet ID:\s*(\d+)\s*\|\s*Pseudo:\s*(@\w+)/i);
        if (match && match[1] && match[2]) {
            const tweetId = match[1];
            const xHandle = match[2];
            console.log(`Tweet ID extrait: ${tweetId}, x_handle extrait: ${xHandle}`);

            try {
                const recentMemes = await Meme.findAll();
                const latestMeme = recentMemes
                    .filter(m => m.message_link && m.message_link.includes(message.channel.id))
                    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

                if (latestMeme) {
                    // const existingInteraction = await Interaction.findByMemeId(latestMeme.id);
                    // if (existingInteraction && existingInteraction.tweet_id) {
                    //     message.reply('Ce mème a déjà un tweet_id associé.');
                    //     return;
                    // }

                    const user = await User.findByXHandle(xHandle);
                    if (!user) {
                        message.reply(`Aucun utilisateur trouvé avec le x_handle ${xHandle}.`);
                        return;
                    }

                    const interaction = await Interaction.create(latestMeme.id, user.id, 'tweet', 5);
                    const success = await InteractionService.associateTweetId(interaction.id, tweetId);
                    if (success) {
                        message.reply(`Tweet ID ${tweetId} associé avec succès à l'interaction pour ${xHandle} !`);
                    } else {
                        message.reply('Erreur lors de l’association du Tweet ID.');
                    }
                } else {
                    message.reply('Aucun mème récent à associer.');
                }
            } catch (error) {
                console.error('Erreur lors de la gestion du Tweet ID:', error.message);
                message.reply('Une erreur est survenue lors de l’association du Tweet ID.');
            }
        } else {
            message.reply('Format invalide. Utilise "Tweet ID: <tweet_id> | Pseudo: <x_handle>".');
        }
    }

    if (!message.author.bot && message.content.toLowerCase().startsWith('!balance')) {
        console.log('Commande !balance détectée:', message.content);
        const xHandleMatch = message.content.match(/!balance\s+(@\w+)/i);
        if (xHandleMatch && xHandleMatch[1]) {
            const xHandle = xHandleMatch[1];
            console.log(`x_handle extrait: ${xHandle}`);
            try {
                const user = await User.findByXHandle(xHandle);
                if (!user) {
                    message.reply(`Aucun utilisateur trouvé avec le x_handle ${xHandle}.`);
                    return;
                }
                const balance = user.memecoin_balance || 0;
                message.reply(`Le solde de ${xHandle} est de ${balance} mèmecoins.`);
            } catch (error) {
                console.error('Erreur lors de la récupération du solde:', error.message);
                message.reply('Une erreur est survenue lors de la récupération du solde.');
            }
        } else {
            message.reply('Format invalide. Utilise ce format "!balance @Yamoussa224".');
        }
    }

    if (!message.author.bot && !message.content.toLowerCase().includes('tweet id:')) {
        const args = message.content.split(' ');
        const command = args[0].toLowerCase();

        if (command === '!link') {
            const xHandle = args[1];
            if (!xHandle) 
                return message.reply('Veuillez fournir votre pseudo X (ex. : !link @username).');

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