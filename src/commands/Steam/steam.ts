import { ApplyOptions } from '@sapphire/decorators';
import { Subcommand } from '@sapphire/plugin-subcommands';
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	EmbedBuilder,
	InteractionContextType,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	time,
	TimestampStyles
} from 'discord.js';
import { addSteamAccount, editSteamAccount, getSteamAccount, prisma } from '../../lib/prisma';
import { pagination } from '../../lib/steamListPagination';

import { forceCheckAccount, checkSteamAccount } from '../../lib/steamClient';
import _ from 'lodash';
import { startMenuTimer } from '../../lib/menuTimer';

@ApplyOptions<Subcommand.Options>({
	name: 'steam',
	description: 'Steam commands',
	cooldownDelay: 15 * 1000,
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
						.addBooleanOption((option) =>
							option //
								.setName('force')
								.setDescription('Should the bot force fetch account info from Steam?')
								.setRequired(false)
						)
						.addBooleanOption((option) =>
							option //
								.setName('force_login')
								.setDescription('Should the bot force login to Steam?')
								.setRequired(false)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand //
						.setName('list')
						.setDescription('List steam accounts')
						.addStringOption((option) =>
							option //
								.setName('find_game')
								.setDescription('Find specific account(s) with a game name')
						)
				)
		);
	}

	public async steamCheckAccount(interaction: Subcommand.ChatInputCommandInteraction) {
		const username = interaction.options.getString('username', true);
		const password = interaction.options.getString('password', true);

		const replied = await interaction.reply('🔍 Checking the account...');
		const accountExists = await getSteamAccount(username);

		const forceUpdate = interaction.options.getBoolean('force') ?? false;
		if (accountExists && !forceUpdate) {
			const dataEmbed = new EmbedBuilder() //
				.setTitle('Steam Account Info')
				.setDescription(
					`User: \`${accountExists.username}\`\nPassword ||\`${accountExists.password}\`||` +
						`\nChecked: ${time(accountExists.lastChecked, TimestampStyles.ShortDateTime)}`
				)
				.setColor('#d5d8df')
				.setFields({ name: '🎮 Games', value: accountExists.games.join(', ') })
				.setFooter({ text: '✅ Data from database' });
			return replied.edit({ content: '', embeds: [dataEmbed] });
		}

		try {
			const forceLogin = interaction.options.getBoolean('force_login') ?? false;
			const accountData = forceLogin ? await forceCheckAccount(username, password) : await checkSteamAccount(username, password);
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
					{ name: '🎮 Games', value: accountData.games.join(', ') }
				)
				.setFooter({ text: '✅ Login successful' });

			if (accountExists && forceUpdate) {
				await editSteamAccount(accountExists!.id, {
					username: username,
					password: password,
					games: accountData.games,
					lastChecked: new Date()
				});
			} else {
				await addSteamAccount(username, password, accountData.games);
			}

			return replied.edit({ content: '', embeds: [dataEmbed] });
		} catch (error: any) {
			return replied.edit(`Failed to log into Steam: \`${error.message}\` ❌`);
		}
	}

	public async steamListAccount(interaction: Subcommand.ChatInputCommandInteraction) {
		let accountLists = await prisma.steamAccounts.findMany();
		const findGame = interaction.options.getString('find_game');
		if (!accountLists.length) {
			return interaction.reply('No steam accounts found').then((message) => {
				setTimeout(async () => {
					await message.delete();
				}, 5 * 1000);
			});
		}

		if (findGame) {
			accountLists = accountLists.filter((account) =>
				account.games.some((game: string) => game.toLowerCase().includes(findGame.toLowerCase()))
			);
			if (!accountLists.length) {
				return interaction.reply(`No steam accounts with game "${findGame}" found.`);
			}
		}

		if (accountLists.length > 25) {
			const pages = [];
			const selections = [];
			const until = Math.ceil(accountLists.length / 25);

			for (let i = 1; i <= until; i++) {
				const spliced = accountLists.splice(0, 24);
				const pageEmbed = new EmbedBuilder() //
					.setTitle('Steam Accounts')
					.setColor('#d5d8df')
					.setDescription('```' + spliced.map((account, index) => `${index + 1}. ${account.username}`).join('\n') + '```')
					.setFooter({ text: `Page ${i} of ${until}` });
				pages.push(pageEmbed);

				const accountOptions = spliced.map((account, index) =>
					new StringSelectMenuOptionBuilder() //
						.setLabel(`${index + 1}. ${account.username}`)
						.setValue(account.username)
				);
				const selectMenu = new StringSelectMenuBuilder() //
					.setCustomId('steamAccountSelect')
					.setPlaceholder('Select an account')
					.addOptions(accountOptions);
				const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>() //
					.addComponents(selectMenu);
				selections.push(actionRow);
			}
			return pagination(interaction, pages, selections);
		}

		await interaction.deferReply();

		const accountOptions = accountLists.map((account, index) =>
			new StringSelectMenuOptionBuilder() //
				.setLabel(`${index + 1}. ${account.username}`)
				.setValue(account.username)
		);
		const selectMenu = new StringSelectMenuBuilder() //
			.setCustomId(`steamAccountSelect:${interaction.user.id}`)
			.setPlaceholder('Select an account')
			.addOptions(accountOptions);
		const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>() //
			.addComponents(selectMenu);

		const dataEmbed = new EmbedBuilder() //
			.setTitle('Steam Accounts')
			.setColor('#d5d8df')
			.setDescription('```' + accountLists.map((account, index) => `${index + 1}. ${account.username}`).join('\n') + '```');

		const currMsg = await interaction.editReply({ content: '', embeds: [dataEmbed], components: [actionRow] });
		startMenuTimer(currMsg);

		return currMsg;
	}
}
