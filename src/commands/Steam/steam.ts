import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType } from 'discord.js';

import checkAccount from '../../lib/steamClient/steamClient';

@ApplyOptions<Subcommand.Options>({
	name: 'steam',
	description: 'Steam commands',
	subcommands: [{ name: 'check', chatInputRun: 'steamCheckAccount' }]
})
export class SteamCommands extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall];
		const contexts: InteractionContextType[] = [
			InteractionContextType.Guild,
			InteractionContextType.BotDM,
			InteractionContextType.PrivateChannel
		];

		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setIntegrationTypes(integrationTypes)
				.setContexts(contexts)
				.addSubcommand((subcommand) =>
					subcommand //
						.setName('check')
						.setDescription('Check steam account')
						.addStringOption((option) =>
							option //
								.setName('username')
								.setDescription('Steam username')
								.setRequired(true)
						)
						.addStringOption((option) =>
							option //
								.setName('password')
								.setDescription('Steam password')
								.setRequired(true)
						)
				)
		);
	}

	public async steamCheckAccount(interaction: Subcommand.ChatInputCommandInteraction) {
		const username = interaction.options.getString('username', true);
		const password = interaction.options.getString('password', true);

		const replied = await interaction.reply('🔍 Checking the account...');
		try {
			const accountData = await checkAccount(username, password);
			const dataEmbed = new EmbedBuilder() //
				.setTitle('Steam Account Info')
				.setURL(`https://steamcommunity.com/profiles/${accountData.steamID}`)
				.setDescription(`User: **${accountData.accountInfo.name}**`)
				.setColor('#d5d8df')
				.setFields(
					{ name: 'Steam ID', value: accountData.steamID, inline: true },
					{ name: '🌐 Country', value: accountData.accountInfo.country || 'Unknown', inline: true },
					{ name: '✉️ Email Address', value: accountData.emailInfo?.email || 'Unknown', inline: true },
					{ name: 'Email Validated', value: accountData.emailInfo?.validated ? 'yes' : 'no' },
					{ name: '⛔ Limited', value: accountData.limitation.limited ? 'yes' : 'no', inline: true },
					{ name: '🚫 Community Banned', value: accountData.limitation.communityBanned ? 'yes' : 'no', inline: true },
					{ name: '🔒 Locked', value: accountData.limitation.locked ? 'yes' : 'no', inline: true }
				)
				.setFooter({ text: '✅ Login successful' });

			return replied.edit({ content: '', embeds: [dataEmbed] });
		} catch (error: any) {
			return replied.edit(`Failed to log into Steam: \`${error.message}\` ❌`);
		}
	}
}
