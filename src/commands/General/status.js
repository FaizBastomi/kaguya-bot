const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');

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
\`\`\`
Memory    : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
Node.js   : ${process.version}
Discord.js: ${version}
Uptime    : ${ms(interaction.client.uptime, { long: true })}
\`\`\`
`
			)
			.setTimestamp();

		return interaction.editReply({ embeds: [infoEmbed] });
	}
}

module.exports = {
	StatusCommand
};
