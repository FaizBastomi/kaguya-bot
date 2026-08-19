import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
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

		const created = Math.floor(user.createdTimestamp / 1000);
		const joined = member?.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;

		const roleCollection = member?.roles.cache.filter((r) => r.id !== interaction.guildId);
		const sortedRoles = roleCollection?.sort((a, b) => b.position - a.position);
		const roles = sortedRoles?.size ? sortedRoles.map((r) => `<@&${r.id}>`).join(' ') : null;
		const roleCount = sortedRoles?.size || 0;
		const accentColor = member?.displayColor || null;

		const keyPerms = [
			'Administrator',
			'ManageGuild',
			'ManageRoles',
			'ManageChannels',
			'ManageMessages',
			'KickMembers',
			'BanMembers',
			'ModerateMembers'
		];
		const userPerms = member?.permissions.toArray() || [];
		const specialPermsArray = userPerms.filter((p) => keyPerms.includes(p));
		const specialPerms = specialPermsArray.length > 0 ? specialPermsArray.map((p) => `\`${p}\``).join(', ') : null;

		const headerSection = new SectionBuilder()
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(`### ${user.username}`),
				new TextDisplayBuilder().setContent(`<@${user.id}>\nID: ${user.id}`)
			)
			.setThumbnailAccessory(new ThumbnailBuilder({ media: { url: user.displayAvatarURL({ size: 512, extension: 'png' }) } }));

		const container = new ContainerBuilder();
		if (accentColor) container.setAccentColor(accentColor);
		container
			.addSectionComponents(headerSection)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`**Created:** <t:${created}:F> (<t:${created}:R>)\n**Joined:** ${joined ? `<t:${joined}:F> (<t:${joined}:R>)` : 'N/A'}`
				)
			);

		if (roles) {
			container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Roles [${roleCount}]:**\n${roles}`));
		}

		if (specialPerms) {
			container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Key Permissions:**\n${specialPerms}`));
		}

		const avatarButton = new ButtonBuilder().setCustomId(`whois_avatar_${user.id}`).setLabel('View Avatar').setStyle(ButtonStyle.Primary);
		container.addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(avatarButton));

		return interaction.reply({
			components: [container],
			flags: MessageFlags.IsComponentsV2,
			allowedMentions: { parse: [] }
		});
	}
}
