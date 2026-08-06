import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import {
	ApplicationIntegrationType,
	ContainerBuilder,
	InteractionContextType,
	MessageFlags,
	SectionBuilder,
	TextDisplayBuilder,
	ThumbnailBuilder
} from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'whois',
	description: 'Get detailed information about a user'
})
export class WhoisCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder
				.setName(this.name)
				.setDescription(this.description)
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild])
				.addUserOption((option) => option.setName('userid').setDescription('The user to check').setRequired(true))
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const user = interaction.options.getUser('userid', true);
		const member = interaction.guild ? await interaction.guild.members.fetch(user.id).catch(() => null) : null;

		const created = `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`;
		const joined = member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A';
		const roles =
			member?.roles.cache
				.filter((r) => r.id !== interaction.guildId)
				.map((r) => `<@&${r.id}>`)
				.join(' ') || 'None';

		const section = new SectionBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### ${user.username}`),
				new TextDisplayBuilder().setContent(
					`<@!${user.id}> (${user.id})\n**Created:** ${created} — **Joined:** ${joined}\n**Roles:**\n${roles}`
				)
			)
			.setThumbnailAccessory(new ThumbnailBuilder({ media: { url: user.displayAvatarURL({ size: 512, extension: 'png' }) } }));

		return interaction.reply({
			components: [new ContainerBuilder().addSectionComponents(section)],
			flags: MessageFlags.IsComponentsV2,
			allowedMentions: { parse: [] }
		});
	}
}
