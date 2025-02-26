const { MessageLimits } = require('@sapphire/discord-utilities');
const { Subcommand } = require('@sapphire/plugin-subcommands');
const { MessageFlags } = require('discord.js');

const { config } = require('../../index');

class PurgeCommands extends Subcommand {
	constructor(ctx, options) {
		super(ctx, {
			...options,
			name: 'purge',
			description: 'Purge messages from a channel',
			subcommands: [
				{ name: 'all', chatInputRun: 'chatPurgeAll' },
				{ name: 'user', chatInputRun: 'chatPurgeUser' }
			],
			cooldownDelay: 10
		});
	}

	registerApplicationCommands(registry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder //
					.setName(this.name)
					.setDescription(this.description)
					.addSubcommand((subcommand) =>
						subcommand //
							.setName('all')
							.setDescription('Purge all messages from a channel')
							.addStringOption((option) =>
								option //
									.setName('amount')
									.setDescription('The amount of messages to purge')
									.setRequired(true)
							)
					)
					.addSubcommand((subcommand) =>
						subcommand //
							.setName('user')
							.setDescription('Purge all messages from a user')
							.addUserOption((option) =>
								option //
									.setName('user')
									.setDescription('The user to purge messages from')
									.setRequired(true)
							)
							.addStringOption((option) =>
								option //
									.setName('amount')
									.setDescription('The amount of messages to purge')
									.setRequired(false)
							)
					),
			{
				idHints: config.data?.[this.name + 'ID'] || '',
				registerCommandIfMissing: true
			}
		);
	}

	async chatPurgeAll(interaction) {
		await interaction.deferReply();

		const amountOption = interaction.options.getString('amount');
		const amount = parseInt(amountOption) + 1;

		if (isNaN(amount) || amount < 2 || amount > MessageLimits.MaximumMessagesToBulkDelete) {
			return interaction.reply({
				content: `Please provide a number between 2 and ${MessageLimits.MaximumMessagesToBulkDelete}`,
				flags: MessageFlags.Ephemeral
			});
		}

		const messages = await interaction.channel.messages.fetch({ limit: amount });
		const filteredMessages = messages.filter(
			(msg) => msg.author.id !== interaction.client.id && Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
		);

		await interaction.channel.bulkDelete(filteredMessages, true);

		return interaction.editReply(`Successfully purged **${filteredMessages.size}** messages!`).then((msg) => {
			setTimeout(() => {
				msg.delete();
			}, 3 * 1000);
		});
	}

	async chatPurgeUser(interaction) {
		try {
			await interaction.deferReply();

			const amountOption = interaction.options.getString('amount');
			const user = interaction.options.getUser('user');
			const amount = amountOption ? parseInt(amountOption) + 1 : 100;

			if (isNaN(amount) || amount < 2 || amount > MessageLimits.MaximumMessagesToBulkDelete) {
				return interaction.editReply({
					content: `Please provide a number between 2 and ${MessageLimits.MaximumMessagesToBulkDelete}`,
					flags: MessageFlags.Ephemeral
				});
			}

			const messages = await interaction.channel.messages.fetch({ limit: amount });
			const filteredMessages = messages.filter(
				(msg) => msg.author.id === user.id && Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
			);

			await interaction.channel.bulkDelete(filteredMessages, true);

			return interaction.editReply(`Successfully purged **${filteredMessages.size}** messages from **${user.tag}**!`).then((msg) => {
				setTimeout(() => {
					msg.delete();
				}, 3 * 1000);
			});
		} catch (error) {
			console.error(error);
		}
	}
}

module.exports = {
	PurgeCommands
};
