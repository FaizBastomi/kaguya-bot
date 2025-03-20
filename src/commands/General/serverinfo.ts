import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, ChannelType, EmbedBuilder, InteractionContextType, MessageFlags } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'serverinfo',
	description: 'Get information about the server',
	cooldownDelay: 5 * 1000
})
export class ServerInfoCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall];
		const contexts: InteractionContextType[] = [InteractionContextType.Guild];

		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setIntegrationTypes(integrationTypes)
				.setContexts(contexts)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const guild = interaction.guild;
		if (!guild) return interaction.reply({ content: 'This command can only be used in a server', flags: MessageFlags.Ephemeral });

		await interaction.deferReply();

		const owner = await guild.fetchOwner();
		const memberCount = guild.memberCount;
		const roleCount = guild.roles.cache.size;
		const boostCount = guild.premiumSubscriptionCount ?? 0;

		let categoryChannels = 0;
		let textChannels = 0;
		let voiceChannels = 0;
		let threadChannels = 0;

		guild.channels.cache.forEach((channel) => {
			switch (channel.type) {
				case ChannelType.GuildCategory:
					categoryChannels++;
					break;
				case ChannelType.GuildText:
					textChannels++;
					break;
				case ChannelType.GuildVoice:
					voiceChannels++;
					break;
				case ChannelType.PrivateThread:
				case ChannelType.PublicThread:
					threadChannels++;
					break;
				default:
					break;
			}
		});

		const serverInfo = new EmbedBuilder()
			.setAuthor({ name: guild.name, iconURL: guild.iconURL({ size: 1024 }) ?? undefined })
			.setThumbnail(guild.iconURL({ size: 2048 }) ?? null)
			.setFields([
				{ name: 'Owner', value: owner.user.username, inline: true },
				{ name: 'Members', value: memberCount.toString(), inline: true },
				{ name: 'Roles', value: roleCount.toString(), inline: true },
				{ name: 'Category Channels', value: categoryChannels.toString(), inline: true },
				{ name: 'Text Channels', value: textChannels.toString(), inline: true },
				{ name: 'Voice Channels', value: voiceChannels.toString(), inline: true },
				{ name: 'Thread Channels', value: threadChannels.toString(), inline: true },
				{ name: 'Boosts', value: boostCount.toString(), inline: true }
			])
			.setImage(guild.bannerURL({ size: 4096 }) ?? null)
			.setColor('#d5d8df')
			.setFooter({
				text: `ID: ${guild.id} | Server Created • ${guild.createdAt.toLocaleDateString()} ${guild.createdAt.toLocaleTimeString()}`
			});

		return interaction.editReply({ embeds: [serverInfo] });
	}
}
