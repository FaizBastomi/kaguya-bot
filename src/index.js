require('dotenv').config({ path: './.env' });
require('@sapphire/plugin-hmr/register');
const { SapphireClient, LogLevel } = require('@sapphire/framework');
const { GatewayIntentBits } = require('discord.js');

const Config = require('../config');

const client = new SapphireClient({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildModeration
	],
	logger: { level: LogLevel.Debug },
	hmr: {
		enabled: true
	}
});

client.login(process.env.TOKEN);

module.exports = {
	config: { data: { ...Config.getConfig() }, ...Config }
};
