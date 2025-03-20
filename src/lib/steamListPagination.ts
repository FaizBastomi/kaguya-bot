import { isAnyInteraction } from '@sapphire/discord.js-utilities';
import {
	type EmbedBuilder,
	type ButtonInteraction,
	type ChatInputCommandInteraction,
	ButtonBuilder,
	ButtonStyle,
	ActionRowBuilder,
	ComponentType
} from 'discord.js';

export async function pagination(interaction: ChatInputCommandInteraction | ButtonInteraction, pages: EmbedBuilder[], time: number = 30 * 1000) {
	if (!isAnyInteraction(interaction)) throw new Error('Invalid interaction type');
	if (!pages) return;
	if (!Array.isArray(pages)) return;

	if (typeof time !== 'number') return;

	const defer = await interaction.deferReply();

	if (pages.length === 1) {
		const page = await defer.edit({
			embeds: [pages[0]]
		});
		return page;
	}

	// Button
	const prev = new ButtonBuilder() //
		.setCustomId('prev')
		.setEmoji({ name: '⬅️' })
		.setStyle(ButtonStyle.Primary)
		.setDisabled(true);
	const next = new ButtonBuilder() //
		.setCustomId('next')
		.setEmoji({ name: '➡️' })
		.setStyle(ButtonStyle.Primary);
	const home = new ButtonBuilder() //
		.setCustomId('home')
		.setEmoji({ name: '🏠' })
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(true);

	const buttonRow = new ActionRowBuilder<ButtonBuilder>() //
		.addComponents(prev, next, home);
	let index = 0;

	const currentPage = await defer.edit({
		embeds: [pages[index]],
		components: [buttonRow]
	});

	const collector = currentPage.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time,
		filter: (i) => i.user.id === interaction.user.id
	});

	collector.on('collect', async (i) => {
		i.deferUpdate();

		if (i.customId === 'prev') {
			if (index > 0) index--;
		} else if (i.customId === 'home') {
			index = 0;
		} else if (i.customId === 'next') {
			if (index < pages.length - 1) index++;
		}

		if (index === 0) {
			prev.setDisabled(true);
			home.setDisabled(true);
		} else {
			prev.setDisabled(false);
			home.setDisabled(false);
		}

		if (index === pages.length - 1) next.setDisabled(true);
		else next.setDisabled(false);

		await defer.edit({
			embeds: [pages[index]],
			components: [buttonRow]
		});

		collector.resetTimer();
	});

	collector.on('end', async () => {
		await defer.edit({
			content: 'This interaction has ended',
			components: []
		});
	});

	return currentPage;
}
