import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { EmbedBuilder, MessageFlags, time, TimestampStyles, type StringSelectMenuInteraction } from 'discord.js';

import { deleteSteamAccount, editSteamAccount, getSteamAccount } from '../lib/prisma';
import { checkSteamAccount } from '../lib/steamClient';
import lodash from 'lodash';
import { startMenuTimer } from '../lib/menuTimer';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.SelectMenu
})
export class MenuHandler extends InteractionHandler {
	public override async run(interaction: StringSelectMenuInteraction) {
		const [_, userId] = interaction.customId.split(':');
		if (interaction.user.id !== userId) {
			return interaction.reply({
				content: 'This interaction is not for you.',
				flags: MessageFlags.Ephemeral
			});
		}

		startMenuTimer(interaction.message);

		const selectedValue = interaction.values[0];
		const account = await getSteamAccount(selectedValue);

		if (!account) {
			return interaction.reply('Account not found in the database.');
		}

		const replied = await interaction.reply('🔍 Checking the account...');
		try {
			const accountData = await checkSteamAccount(account!.username, account!.password);
			const newData = {
				username: account!.username,
				password: account!.password,
				games: accountData.games,
				lastChecked: new Date()
			};

			if (!lodash.isEqual(accountData, account)) {
				await editSteamAccount(account!.id, {
					username: newData.username,
					password: newData.password,
					games: newData.games,
					lastChecked: newData.lastChecked
				});
			}

			const embed = new EmbedBuilder() //
				.setTitle('Steam Account')
				.setColor('#d5d8df')
				.setDescription(
					`**Account**: \`${account!.username}\`\n**Password**: ||\`\`\`${account!.password}\`\`\`||` +
						`\n**Checked**: ${time(newData.lastChecked, TimestampStyles.ShortDateTime)}`
				)
				.setFields({ name: '🎮 Games', value: account!.games.join(', ') })
				.setTimestamp();

			return replied.edit({
				content: '',
				embeds: [embed]
			});
		} catch (error: any) {
			await deleteSteamAccount(account!.id);
			return replied.edit(`Failed to log into Steam: \`${error.message}\` ❌\nAccount ${account!.username} deleted`);
		}
	}

	public override parse(interaction: StringSelectMenuInteraction) {
		const [prefix] = interaction.customId.split(':');
		if (prefix !== 'steamAccountSelect') return this.none();

		return this.some();
	}
}
