require('dotenv').config({ path: './.env' });
require('@sapphire/plugin-hmr/register');
const { SapphireClient, LogLevel } = require('@sapphire/framework');
const { GatewayIntentBits, Partials } = require('discord.js');

const Config = require('../config');

const client = new SapphireClient({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.DirectMessages
	],
	logger: { level: LogLevel.Debug },
	partials: [Partials.Channel],
	hmr: {
		enabled: true
	}
});

client.login(process.env.TOKEN);

module.exports = {
	config: { data: { ...Config.getConfig() }, ...Config }
};
