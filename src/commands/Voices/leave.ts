import { getVoiceConnection } from '@discordjs/voice';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, MessageFlags } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'leave',
	description: 'Make the bot leave your voice channel'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];

		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setIntegrationTypes(integrationTypes)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const connection = getVoiceConnection(interaction.guildId!);
		let member = interaction.guild!.members.cache.get(interaction.user.id);

		if (!member?.voice.channel) {
			member = await interaction.guild!.members.fetch(interaction.user.id);
		}
		if (!connection) {
			return interaction.editReply("I'm not in a voice channel!");
		}
		if (connection.joinConfig.channelId !== member?.voice.channelId) {
			return interaction.editReply('You need to be in the same voice channel as me!');
		}

		try {
			connection.destroy();
			return interaction.editReply('Left the voice channel!');
		} catch (error) {
			console.error('Leave command error:', error);
			return interaction.editReply('Failed to leave your voice channel!');
		}
	}
}
