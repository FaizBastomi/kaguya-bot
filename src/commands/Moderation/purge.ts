import { ApplyOptions } from '@sapphire/decorators';
import { MessageLimits } from '@sapphire/discord-utilities';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, ChannelType, InteractionContextType, PermissionsBitField, TextChannel } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'purge',
	description: 'Purge a certain amount of messages',
	cooldownDelay: 5 * 1000
})
export class PurgeCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
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
				.addStringOption((option) =>
					option //
						.setName('amount')
						.setDescription('The amount of messages to purge')
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const channel = interaction.channel;

		if (channel?.type == ChannelType.GuildText) {
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
			const filteredMessages = messages?.filter((msg) => Date.now() - msg.createdTimestamp < 14 * 24 * 60 * 60 * 1000);

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
}
