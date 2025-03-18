import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ApplicationIntegrationType, ChannelType, InteractionContextType, PermissionsBitField, TextChannel } from 'discord.js';

@ApplyOptions<Subcommand.Options>({
	name: 'nuke',
	description: 'Nuke a channel',
	cooldownDelay: 10 * 1000,
	subcommands: [
		{ name: 'copy', chatInputRun: 'nukeChannelCopy' },
		{ name: 'delete', chatInputRun: 'nukeChannelDelete' }
	]
})
export class NukeCommands extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
		const contexts: InteractionContextType[] = [InteractionContextType.Guild];
		const permissionsBitField = PermissionsBitField.Flags.ManageChannels;

		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setDefaultMemberPermissions(permissionsBitField)
				.setIntegrationTypes(integrationTypes)
				.setContexts(contexts)
				.addSubcommand((subcommand) =>
					subcommand //
						.setName('copy')
						.setDescription('Copy the channel before nuke it')
				)
				.addSubcommand((subcommand) =>
					subcommand //
						.setName('delete')
						.setDescription('Nuke the channel')
				)
		);
	}

	public async nukeChannelCopy(interaction: Subcommand.ChatInputCommandInteraction) {
		const channel = interaction.channel;
		if (channel?.type == ChannelType.GuildText) {
			const textChannel = channel as TextChannel;
			textChannel.clone();
			textChannel.delete();
		}
	}

	public async nukeChannelDelete(interaction: Subcommand.ChatInputCommandInteraction) {
		const channel = interaction.channel;
		if (channel?.type == ChannelType.GuildText) {
			const textChannel = channel as TextChannel;
			textChannel.delete();
		}
	}
}
