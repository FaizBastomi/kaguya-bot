import { ApplyOptions } from '@sapphire/decorators';
import { MessageLimits } from '@sapphire/discord-utilities';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ApplicationIntegrationType, ChannelType, InteractionContextType, PermissionsBitField, TextChannel } from 'discord.js';

@ApplyOptions<Subcommand.Options>({
	name: 'purge',
	description: 'Purge a certain amount of messages',
	cooldownDelay: 5 * 1000,
	subcommands: [
		{ name: 'all', chatInputRun: 'purgeChatAll' },
		{ name: 'user', chatInputRun: 'purgeChatUser' }
	]
})
export class PurgeCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
		const contexts: InteractionContextType[] = [InteractionContextType.Guild];
		const permissionsBitFields = PermissionsBitField.Flags.ManageMessages | PermissionsBitField.Flags.ManageChannels;

		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setDefaultMemberPermissions(permissionsBitFields)
				.setIntegrationTypes(integrationTypes)
				.setContexts(contexts)
				.addSubcommand((subcommand) =>
					subcommand //
						.setName('all')
						.setDescription('Purge all messages')
						.addStringOption((option) =>
							option //
								.setName('amount')
								.setDescription('The amount of messages to purge')
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
						)
				)
		);
	}

	public async purgeChatAll(interaction: Subcommand.ChatInputCommandInteraction) {
		const channel = interaction.channel;

		if (channel?.type === ChannelType.GuildText) {
			const textChannel = channel as TextChannel;
			const amountOption = interaction.options.getString('amount');
			const amount = amountOption ? parseInt(amountOption) : 100;

			if (isNaN(amount) || amount < 2 || amount > MessageLimits.MaximumMessagesToBulkDelete) {
				return interaction.reply(`Please provide a number between 2 and ${MessageLimits.MaximumMessagesToBulkDelete}`).then((msg) => {
					setTimeout(async () => {
						await msg.delete();
					}, 5 * 1000);
				});
			}

			const messages = await textChannel.messages.fetch({ limit: amount });
			const filteredMessages = messages.filter((msg) => Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000);

			await interaction.deferReply();

			if (filteredMessages.size < 1) {
				return interaction.editReply('No messages found to delete').then((msg) => {
					setTimeout(async () => {
						await msg.delete();
					}, 5 * 1000);
				});
			}

			await textChannel.bulkDelete(filteredMessages, true);

			return interaction.editReply(`Successfully purged **${filteredMessages?.size}** messages`).then((msg) => {
				setTimeout(async () => {
					await msg.delete();
				}, 5 * 1000);
			});
		}
	}

	public async purgeChatUser(interaction: Subcommand.ChatInputCommandInteraction) {
		const channel = interaction.channel;

		if (channel?.type === ChannelType.GuildText) {
			const textChannel = channel as TextChannel;
			const user = interaction.options.getUser('user', true);
			const amountOption = interaction.options.getString('amount');
			const amount = amountOption ? parseInt(amountOption) : 100;

			if (isNaN(amount) || amount < 2 || amount > MessageLimits.MaximumMessagesToBulkDelete) {
				return interaction.reply(`Please provide a number between 2 and ${MessageLimits.MaximumMessagesToBulkDelete}`).then((msg) => {
					setTimeout(async () => {
						await msg.delete();
					}, 5 * 1000);
				});
			}

			const messages = await textChannel.messages.fetch({ limit: amount });
			const filteredMessages = messages.filter(
				(msg) => msg.author.id === user.id && Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000
			);

			await interaction.deferReply();

			if (filteredMessages.size < 1) {
				return interaction.editReply('No messages found to delete').then((msg) => {
					setTimeout(async () => {
						await msg.delete();
					}, 5 * 1000);
				});
			}

			await textChannel.bulkDelete(filteredMessages, true);

			return interaction.editReply(`Successfully purged **${filteredMessages?.size}** messages from ${user}`).then((msg) => {
				setTimeout(async () => {
					await msg.delete();
				}, 5 * 1000);
			});
		}
	}
}
