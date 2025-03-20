import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType } from 'discord.js';

import checkAccount from '../../lib/steamClient';
import { addSteamAccount, editSteamAccount, getSteamAccount, prisma } from '../../lib/prisma';
import { pagination } from '../../lib/steamListPagination';

@ApplyOptions<Subcommand.Options>({
	name: 'steam',
	description: 'Steam commands',
	subcommands: [
		{ name: 'check', chatInputRun: 'steamCheckAccount' },
		{ name: 'list', chatInputRun: 'steamListAccount' }
	]
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
				.addSubcommand((subcommand) =>
					subcommand //
						.setName('list')
						.setDescription('List steam accounts')
						.addStringOption((option) =>
							option //
								.setName('find_game')
								.setDescription('Find game')
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
					{ name: '🔒 Locked', value: accountData.limitation.locked ? 'yes' : 'no', inline: true },
					{ name: '🎮 Games', value: "```"+accountData.games.join(', ')+"```" },
				)
				.setFooter({ text: '✅ Login successful' });

			const accountExists = await getSteamAccount(username);
			if (accountExists) {
				await editSteamAccount(accountExists.id, username, password, accountData.games);
			} else {
				await addSteamAccount(username, password, accountData.games);
			}

			return replied.edit({ content: '', embeds: [dataEmbed] });
		} catch (error: any) {
			return replied.edit(`Failed to log into Steam: \`${error.message}\` ❌`);
		}
	}

	public async steamListAccount(interaction: Subcommand.ChatInputCommandInteraction) {
		const accountLists = await prisma.steamAccounts.findMany();
		const findGame = interaction.options.getString('find_game');
		if (!accountLists.length) {
			return interaction.reply('No steam accounts found').then((message) => {
				setTimeout(async () => {
					await message.delete();
				}, 5 * 1000);
			});
		}

		if (accountLists.length > 25) {
			const pages = [];
			const until = Math.ceil(accountLists.length / 25);

			for (let i = 1; i <= until; i++) {
				const spliced = accountLists.splice(0, 24);
				const pageEmbed = new EmbedBuilder() //
					.setTitle('Steam Accounts')
					.setColor('#d5d8df')
					.setDescription('```' + spliced.map((account, index) => `${index + 1}. ${account.username}`).join('\n') + '```')
					.setFooter({ text: `Page ${i} of ${until}` });
				pages.push(pageEmbed);
			}
			return pagination(interaction, pages);
		}

		await interaction.deferReply();

		const dataEmbed = new EmbedBuilder() //
			.setTitle('Steam Accounts')
			.setColor('#d5d8df')
			.setDescription('```' + accountLists.map((account, index) => `${index + 1}. ${account.username}`).join('\n') + '```');

		return interaction.editReply({ content: '', embeds: [dataEmbed] });
	}
}
