import { getVoiceConnection, joinVoiceChannel } from '@discordjs/voice';
import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, PermissionsBitField } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'join',
	description: 'Make the bot join your voice channel',
	cooldownDelay: 15 * 1000,
	preconditions: ['BotOrGuildOwner'],
	requiredClientPermissions: [PermissionsBitField.Flags.Connect]
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
		await interaction.deferReply();

		try {
			let member = interaction.guild!.members.cache.get(interaction.user.id);
			if (!member || !member.voice.channel) {
				member = await interaction.guild!.members.fetch(interaction.user.id);
			}
			const voiceCh = member.voice.channel;

			if (!voiceCh) {
				return interaction.editReply('You are not in a voice channel!');
			}
			if (!voiceCh?.isVoiceBased()) {
				return interaction.editReply('This is not a voice channel!');
			}

			// Check if bot has permission to join
			const permissions = voiceCh?.permissionsFor(interaction.guild!.members.me!);
			if (!permissions?.has(PermissionsBitField.Flags.Connect)) {
				return interaction.editReply('I do not have permission to join your voice channel!');
			}

			const exisitingConnection = getVoiceConnection(interaction.guildId!);
			if (exisitingConnection) {
				const currentChannelId = exisitingConnection.joinConfig.channelId;
				if (currentChannelId === voiceCh.id) {
					return interaction.editReply("I'm already in your voice channel!");
				}

				exisitingConnection.destroy();
			}

			joinVoiceChannel({
				channelId: voiceCh.id,
				guildId: interaction.guildId!,
				adapterCreator: interaction.guild!.voiceAdapterCreator,
				selfDeaf: true,
				selfMute: true
			});

			return interaction.editReply('Joined your voice channel!');
		} catch (error) {
			console.error('Join command error:', error);
			return interaction.editReply('Failed to join your voice channel!');
		}
	}
}
