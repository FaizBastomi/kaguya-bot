const { Subcommand } = require('@sapphire/plugin-subcommands');
const { EmbedBuilder, ApplicationIntegrationType } = require('discord.js');
const { checkSteamAccount } = require('../../libs/SteamClient');

const { config } = require('../../index');

class SteamCommands extends Subcommand {
	constructor(ctx, options) {
		super(ctx, {
			...options,
			name: 'steam',
			description: 'Check a user Steam profile',
			subcommands: [{ name: 'check', chatInputRun: 'steamCheckAccount' }]
		});
	}

	registerApplicationCommands(registry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder //
					.setName(this.name)
					.setDescription(this.description)
					.setIntegrationTypes([ApplicationIntegrationType.UserInstall, ApplicationIntegrationType.GuildInstall])
					.addSubcommand((command) =>
						command //
							.setName('check')
							.setDescription('Check a user Steam profile')
							.addStringOption((option) =>
								option //
									.setName('username')
									.setDescription('Username credential')
									.setRequired(true)
							)
							.addStringOption((option) =>
								option //
									.setName('password')
									.setDescription('Password credential')
									.setRequired(true)
							)
					),
			{
				idHints: config.data?.[this.name + 'ID'] || '',
				registerCommandIfMissing: true
			}
		);
	}

	async steamCheckAccount(interaction) {
		const username = interaction.options.getString('username');
		const password = interaction.options.getString('password');

		const replied = await interaction.reply('🔍 Checking the account...');
		try {
			const accountData = await checkSteamAccount(username, password);
			const dataEmbed = new EmbedBuilder() //
				.setTitle('Steam Account Info')
				.setURL(`https://steamcommunity.com/profiles/${accountData.steamID}`)
				.setDescription(`User: **${accountData.accountInfo.name}**`)
				.setColor('#03e3a3')
				.setFields(
					{ name: 'Steam ID', value: accountData.steamID, inline: true },
					{ name: '🌐 Country', value: accountData.accountInfo.country || 'Unknown', inline: true },
					{ name: '✉️ Email Address', value: accountData.emailInfo?.address || 'Unknown', inline: true },
					{ name: 'Email Validated', value: accountData.emailInfo?.validated ? 'yes' : 'no' },
					{ name: '⛔ Limited', value: accountData.limitations.limited ? 'yes' : 'no', inline: true },
					{ name: '🚫 Community Banned', value: accountData.limitations.communityBanned ? 'yes' : 'no', inline: true },
					{ name: '🔒 Locked', value: accountData.limitations.locked ? 'yes' : 'no', inline: true }
				)
				.setFooter({ text: '✅ Login successful' });

			return replied.edit({ content: '', embeds: [dataEmbed] });
		} catch (error) {
			return replied.edit(`Failed to log into Steam: \`${error.message}\` ❌`);
		}
	}
}

module.exports = {
	SteamCommands
};
