const { MessageLimits } = require('@sapphire/discord-utilities');
const { Subcommand } = require('@sapphire/plugin-subcommands');
const { MessageFlags, PermissionsBitField } = require('discord.js');

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
					.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageMessages)
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
		const amountOption = interaction.options.getString('amount');
		const amount = parseInt(amountOption) > 1 ? parseInt(amountOption) + 1 : parseInt(amountOption);

		if (isNaN(amount) || amount < 2 || amount > MessageLimits.MaximumMessagesToBulkDelete) {
			return interaction.editReply(`Please provide a number between 2 and ${MessageLimits.MaximumMessagesToBulkDelete}`).then((msg) => {
				setTimeout(async () => {
					await msg.delete();
				}, 8 * 1000);
			});
		}

		const messages = await interaction.channel.messages.fetch({ limit: amount });
		const filteredMessages = messages.filter((msg) => Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000);

		await interaction.deferReply();

		if (filteredMessages.size < 1) {
			return interaction.editReply('No messages to delete').then((msg) => {
				setTimeout(async () => {
					await msg.delete();
				}, 8 * 1000);
			});
		}

		await interaction.channel.bulkDelete(filteredMessages, true);

		const reply = await interaction.editReply(`Successfully purged **${filteredMessages.size}** messages!`);
		setTimeout(async () => {
			return reply.delete();
		}, 8 * 1000);
	}

	async chatPurgeUser(interaction) {
		try {
			await interaction.deferReply();

			const amountOption = interaction.options.getString('amount');
			const user = interaction.options.getUser('user');
			const amount = parseInt(amountOption) > 1 ? parseInt(amountOption) + 1 : 100;

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

			const reply = await interaction.editReply(`Successfully purged **${filteredMessages.size}** messages from **${user.tag}**!`);
			setTimeout(async () => {
				return reply.delete();
			}, 8 * 1000);
		} catch (error) {
			console.error(error);
		}
	}
}

module.exports = {
	PurgeCommands
};
