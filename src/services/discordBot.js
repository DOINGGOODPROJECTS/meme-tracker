const { Client, GatewayIntentBits } = require('discord.js');
const MemeService = require('./memeService');
const InteractionService = require('./interactionService');
const User = require('../models/User');

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
    // ... (reste du code inchangé)
});

client.login(process.env.DISCORD_TOKEN);

module.exports = client;