import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { EmbedBuilder, time, TimestampStyles, type StringSelectMenuInteraction } from 'discord.js';

import { deleteSteamAccount, editSteamAccount, getSteamAccount } from '../lib/prisma';
import { checkSteamAccount } from '../lib/steamClient';
import _ from 'lodash';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.SelectMenu
})
export class MenuHandler extends InteractionHandler {
	public override async run(interaction: StringSelectMenuInteraction) {
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

			if (!_.isEqual(accountData, account)) {
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
		if (interaction.customId !== 'steamAccountSelect') return this.none();

		return this.some();
	}
}
