const ms = require('ms');
const os = require('os');

const { Command } = require('@sapphire/framework');
const { EmbedBuilder, version } = require('discord.js');

const { config } = require('../../index');

class StatusCommand extends Command {
	constructor(ctx, options) {
		super(ctx, {
			...options,
			name: 'status',
			description: 'Bot Status'
		});
	}

	registerApplicationCommands(registry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder //
					.setName(this.name)
					.setDescription(this.description),
			{
				idHints: config.data?.[this.name + 'ID'] || '',
				registerCommandIfMissing: true
			}
		);
	}

	async chatInputRun(interaction) {
		await interaction.deferReply();

		const infoEmbed = new EmbedBuilder() //
			.setTitle('Information')
			.setDescription(
				`
**Name**: ${interaction.client.user.username}
**ID**: ${interaction.client.user.id}
`
			)
			.addFields(
				{
					name: 'Memory (used/free/total)',
					value: `${formatBytes(process.memoryUsage().heapUsed)} / ${formatBytes(os.freemem())} / ${formatBytes(os.totalmem())}`
				},
				{ name: 'Node.js', value: process.version, inline: true },
				{ name: 'Discord.js', value: version, inline: true },
				{ name: 'Uptime', value: ms(interaction.client.uptime, { long: true }), inline: true }
			)
			.setTimestamp();

		return interaction.editReply({ embeds: [infoEmbed] });
	}
}

module.exports = {
	StatusCommand
};

/**
 * Converts bytes to a human-readable string representation (KB, MB, GB, TB)
 * @param {number} bytes - The number of bytes to format
 * @param {number} decimals - Number of decimal places (default: 1)
 * @returns {string} Formatted string with appropriate unit
 */
function formatBytes(bytes, decimals = 1) {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}
