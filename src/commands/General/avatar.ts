import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType, MessageFlags } from 'discord.js';

@ApplyOptions<Subcommand.Options>({
	name: 'avatar',
	description: 'Get a users avatar',
	subcommands: [
		{ name: 'get', chatInputRun: 'avatarGetDefault' },
		{ name: 'guild', chatInputRun: 'avatarGetGuild' },
		{ name: 'user', chatInputRun: 'avatarGetMain' }
	],
	cooldownDelay: 5 * 1000
})
export class AvatarCommands extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall];
		const contexts: InteractionContextType[] = [InteractionContextType.Guild];

		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setIntegrationTypes(integrationTypes)
				.setContexts(contexts)
				.addSubcommand((subcommand) =>
					subcommand //
						.setName('get')
						.setDescription('Get a users avatar')
						.addUserOption((option) =>
							option //
								.setName('mention')
								.setDescription('The user to get the avatar from')
						)
				)
				.addSubcommand((subcommand) =>
					subcommand //
						.setName('guild')
						.setDescription('Get a users guild avatar')
						.addUserOption((option) =>
							option //
								.setName('mention')
								.setDescription('The user to get the avatar from')
						)
				)
				.addSubcommand((subcommand) =>
					subcommand //
						.setName('user')
						.setDescription('Get the main users avatar')
						.addUserOption((option) =>
							option //
								.setName('mention')
								.setDescription('The user to get the avatar from')
						)
				)
		);
	}

	public async avatarGetDefault(interaction: Subcommand.ChatInputCommandInteraction) {
		const member = interaction.options.getUser('mention') ?? interaction.user;
		const fetchedMember = await interaction.guild!.members.fetch(member.id);
		const avatar = fetchedMember.avatarURL({ size: 4096 }) ?? fetchedMember.displayAvatarURL({ size: 4096 });

		const avatarEmbed = new EmbedBuilder()
			.setAuthor({ name: `${fetchedMember.user.displayName}`, iconURL: avatar ?? undefined })
			.setTitle('Server Avatar')
			.setImage(avatar);
		return interaction.reply({ embeds: [avatarEmbed] });
	}

	public async avatarGetGuild(interaction: Subcommand.ChatInputCommandInteraction) {
		const member = interaction.options.getUser('mention') ?? interaction.user;
		const fetchedMember = await interaction.guild!.members.fetch(member.id);
		const avatar = fetchedMember.avatarURL({ size: 4096 });

		if (!avatar) return interaction.reply({ content: 'This user does not have a guild avatar', flags: MessageFlags.Ephemeral });

		const avatarEmbed = new EmbedBuilder()
			.setAuthor({ name: `${fetchedMember.user.displayName}`, iconURL: avatar })
			.setTitle('Server Avatar')
			.setImage(avatar);
		return interaction.reply({ embeds: [avatarEmbed] });
	}

	public async avatarGetMain(interaction: Subcommand.ChatInputCommandInteraction) {
		const user = interaction.options.getUser('mention') ?? interaction.user;
		const avatar = user.avatarURL({ size: 4096 });

		if (!avatar) return interaction.reply({ content: 'This user does not have an avatar' });

		const avatarEmbed = new EmbedBuilder()
			.setAuthor({ name: `${user.username}`, iconURL: avatar })
			.setTitle('User Avatar')
			.setImage(avatar);
		return interaction.reply({ embeds: [avatarEmbed] });
	}
}
