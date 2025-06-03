const { Client, IntentsBitField } = require('discord.js');
const User = require('../models/User');
const Meme = require('../models/Meme');
const Transaction = require('../models/Transaction');
const XApi = require('./xApi');

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ],
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || message.channel.id !== process.env.DISCORD_CHANNEL_ID) return;

    const args = message.content.split(' ');
    const command = args[0].toLowerCase();

    if (command === '!link') {
        const xHandle = args[1];
        if (!xHandle) return message.reply('Veuillez fournir votre pseudo X (ex. : !link @username).');

        const user = await User.findByDiscordId(message.author.id);
        if (user) return message.reply('Votre compte est déjà lié.');

        await User.create(message.author.id, xHandle);
        message.reply(`Compte X ${xHandle} lié avec succès !`);
    }

    if (command === '!balance') {
        const user = await User.findByDiscordId(message.author.id);
        if (!user) return message.reply('Veuillez d’abord lier votre compte X avec !link.');

        message.reply(`Votre solde de mèmecoins : ${user.memecoin_balance}`);
    }

    if (command === '!redeem') {
        const user = await User.findByDiscordId(message.author.id);
        if (!user) return message.reply('Veuillez d’abord lier votre compte X avec !link.');

        // Exemple : échanger 10 mèmecoins pour un rôle
        const role = message.guild.roles.cache.find((r) => r.name === 'Mème Master');
        if (!role) return message.reply('Rôle non trouvé.');

        if (user.memecoin_balance >= 10) {
            await User.updateBalance(user.id, -10);
            await message.member.roles.add(role);
            message.reply('Vous avez reçu le rôle Mème Master !');
        } else {
            message.reply('Solde insuffisant.');
        }
    }


    // Nouvelle logique pour traquer les images
    if (message.attachments.size > 0 && !message.content.startsWith('!')) {
        const imageUrl = message.attachments.first().url;
        const messageLink = `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`;
        console.log(`Nouvelle image détectée - URL: ${imageUrl}, Lien: ${messageLink}`);

        try {
            // Vérifie si le mème existe déjà (basé sur le message ID ou l'URL)
            const existingMeme = await Meme.findByMessageId(message.id);
            if (!existingMeme) {
                const memeId = await Meme.createFromDiscord(message.id, imageUrl, messageLink);
                console.log(`Mème enregistré avec ID: ${memeId}`);
            } else {
                console.log('Mème déjà enregistré:', message.id);
            }
        } catch (error) {
            console.error('Erreur lors de l’enregistrement du mème:', error.message);
        }
    }
});

// Vérification périodique des retweets
async function checkRetweets() {
    const [memes] = await pool.query('SELECT * FROM memes');
    for (const meme of memes) {
        const retweeters = await XApi.getRetweets(meme.tweet_id);
        for (const retweeter of retweeters) {
            const user = await User.findByDiscordId(retweeter.id); // Note : Associer Discord ID à X ID
            if (user) {
                const [existing] = await pool.query(
                    'SELECT * FROM transactions WHERE user_id = ? AND meme_id = ? AND action_type = "retweet"',
                    [user.id, meme.id]
                );
                if (!existing.length) {
                    await Transaction.create(user.id, meme.id, 'retweet', 1);
                    await User.updateBalance(user.id, 1);
                }
            }
        }
    }
}

setInterval(checkRetweets, 60 * 60 * 1000); // Vérifie toutes les heures

client.login(process.env.DISCORD_TOKEN);

module.exports = client;