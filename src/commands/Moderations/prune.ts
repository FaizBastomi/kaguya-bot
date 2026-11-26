import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { chunk, sleep } from '@sapphire/utilities';
import {
	ActionRowBuilder,
	ApplicationIntegrationType,
	ButtonBuilder,
	ButtonStyle,
	ComponentType,
	ContainerBuilder,
	DiscordAPIError,
	Guild,
	GuildMember,
	InteractionContextType,
	MessageFlags,
	PermissionFlagsBits,
	Routes,
	TextDisplayBuilder,
	type APIMessageSearchResult,
	type RESTGetAPIGuildMessagesSearchResult
} from 'discord.js';

const DISCORD_EPOCH = 1420070400000;
const MAX_AUTHORS_PER_SEARCH = 100;
const SEARCH_PAGE_LIMIT = 25;
const PREVIEW_MEMBER_LIMIT = 20;

export function timestampToSnowflake(timestampMs: number): string {
	return (BigInt(Math.max(0, Math.floor(timestampMs) - DISCORD_EPOCH)) << 22n).toString();
}

function textContainer(text: string, color?: number): ContainerBuilder {
	const container = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
	if (color !== undefined) container.setAccentColor(color);
	return container;
}

async function searchGuildMessages(guild: Guild, query: URLSearchParams): Promise<APIMessageSearchResult> {
	for (let attempt = 0; attempt < 5; attempt++) {
		const res = (await guild.client.rest.get(Routes.guildMessagesSearch(guild.id), {
			query
		})) as RESTGetAPIGuildMessagesSearchResult;

		if ('messages' in res) return res;
		await sleep(Math.max(1000, Math.ceil((res.retry_after || 2) * 1000)));
	}

	throw new Error('Discord search index is still preparing. Please try again shortly.');
}

// ponytail: bisects author_id batches of 100 via guild message search; scales well for quiet servers, but guilds with hundreds of active candidates hit log-split search calls bounded by Discord's search rate limit
export async function findInactiveMemberIds(
	guild: Guild,
	candidateIds: string[],
	minId: string
): Promise<{ inactiveIds: string[]; indexing: boolean }> {
	const queue = chunk(candidateIds, MAX_AUTHORS_PER_SEARCH);
	const inactiveIds: string[] = [];
	let indexing = false;

	while (queue.length > 0) {
		const batch = queue.shift()!;
		const query = new URLSearchParams({
			min_id: minId,
			limit: String(SEARCH_PAGE_LIMIT),
			sort_by: 'timestamp',
			sort_order: 'desc',
			include_nsfw: 'true'
		});
		for (const id of batch) query.append('author_id', id);

		const res = await searchGuildMessages(guild, query);
		if (res.doing_deep_historical_index) indexing = true;

		if (res.total_results === 0 || res.messages.length === 0) {
			inactiveIds.push(...batch);
			continue;
		}

		const activeAuthors = new Set<string>();
		for (const group of res.messages) {
			for (const msg of group) activeAuthors.add(msg.author.id);
		}

		const unknown = batch.filter((id) => !activeAuthors.has(id));
		if (unknown.length === 0) continue;

		// Require < 25 hits so stale total_results during concurrent message creation/deletion cannot truncate active authors.
		if ((res.total_results <= res.messages.length && res.messages.length < SEARCH_PAGE_LIMIT) || batch.length === 1) {
			inactiveIds.push(...unknown);
			continue;
		}

		const mid = Math.ceil(unknown.length / 2);
		queue.unshift(unknown.slice(0, mid), unknown.slice(mid));
	}

	return { inactiveIds, indexing };
}

@ApplyOptions<Command.Options>({
	name: 'prune',
	description: 'Prune inactive members based on their last sent message',
	cooldownDelay: 10 * 1000
})
export class PruneCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
				.setIntegrationTypes([ApplicationIntegrationType.GuildInstall])
				.setContexts([InteractionContextType.Guild])
				.addStringOption((option) =>
					option //
						.setName('time')
						.setDescription('Inactivity duration since last message (e.g. 1d, 5d, 1w, 1mo)')
						.setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const guild = interaction.guild;
		if (!guild || !interaction.memberPermissions) {
			return interaction.reply({ content: 'This command can only be used in a server.', flags: MessageFlags.Ephemeral });
		}

		if (
			!interaction.memberPermissions.any([PermissionFlagsBits.BanMembers, PermissionFlagsBits.KickMembers, PermissionFlagsBits.ModerateMembers])
		) {
			return interaction.reply({
				content: 'You need **Ban Members**, **Kick Members**, or **Moderate Members** permission to use this command.',
				flags: MessageFlags.Ephemeral
			});
		}

		const me = guild.members.me ?? (await guild.members.fetchMe());
		if (!me.permissions.has([PermissionFlagsBits.KickMembers, PermissionFlagsBits.ReadMessageHistory])) {
			return interaction.reply({
				content: 'I need **Kick Members** and **Read Message History** permissions to run this command.',
				flags: MessageFlags.Ephemeral
			});
		}

		const timeInput = interaction.options.getString('time', true).trim();
		const { Duration, DurationFormatter } = await import('@sapphire/duration');
		const duration = new Duration(timeInput);
		if (!Number.isFinite(duration.offset) || duration.offset < 1000) {
			return interaction.reply({
				content: 'Please provide a valid duration of at least 1 second (e.g. `1d`, `5d`, `1w`, `1mo`). Note: `m` = minutes, `mo` = months.',
				flags: MessageFlags.Ephemeral
			});
		}

		await interaction.deferReply({ flags: MessageFlags.Ephemeral });

		const cutoffTimestamp = Date.now() - duration.offset;
		const cutoffSec = Math.floor(cutoffTimestamp / 1000);
		const formattedDuration = new DurationFormatter().format(duration.offset);

		let candidates: GuildMember[];
		let inactiveIds: string[];
		let indexing: boolean;

		try {
			const members = await guild.members.fetch();
			candidates = [...members.values()].filter(
				(member) =>
					!member.user.bot &&
					member.id !== guild.ownerId &&
					member.id !== interaction.user.id &&
					member.kickable &&
					member.joinedTimestamp !== null &&
					member.joinedTimestamp <= cutoffTimestamp
			);

			if (candidates.length === 0) {
				return interaction.editReply({
					components: [
						textContainer(`### No Eligible Members\nNo kickable members joined before <t:${cutoffSec}:F> (<t:${cutoffSec}:R>).`)
					],
					flags: MessageFlags.IsComponentsV2
				});
			}

			await interaction.editReply({
				components: [
					textContainer(
						`### Scanning Activity...\nChecking last message activity for **${candidates.length}** eligible member${candidates.length === 1 ? '' : 's'} since <t:${cutoffSec}:F>...`
					)
				],
				flags: MessageFlags.IsComponentsV2
			});

			({ inactiveIds, indexing } = await findInactiveMemberIds(
				guild,
				candidates.map((m) => m.id),
				timestampToSnowflake(cutoffTimestamp)
			));
		} catch (error) {
			this.container.logger.error(error);
			const hint =
				error instanceof DiscordAPIError
					? 'Ensure the bot has **Read Message History** permission and the **Message Content** intent enabled.'
					: (error as Error).message;

			return interaction.editReply({
				components: [textContainer(`### Prune Failed\nCould not check server message history. ${hint}`, 0xed4245)],
				flags: MessageFlags.IsComponentsV2
			});
		}

		const candidateMap = new Map(candidates.map((m) => [m.id, m]));
		const inactiveMembers = inactiveIds.map((id) => candidateMap.get(id)!).filter(Boolean);

		if (inactiveMembers.length === 0) {
			return interaction.editReply({
				components: [
					textContainer(
						`### No Inactive Members Found\nAll **${candidates.length}** eligible members have sent at least one message since <t:${cutoffSec}:F> (<t:${cutoffSec}:R>).`,
						0x57f287
					)
				],
				flags: MessageFlags.IsComponentsV2
			});
		}

		const previewLines = inactiveMembers
			.slice(0, PREVIEW_MEMBER_LIMIT)
			.map((m) => `• <@${m.id}> (\`${m.user.username}\`)`)
			.join('\n');
		const overflow =
			inactiveMembers.length > PREVIEW_MEMBER_LIMIT
				? `\n*...and **${inactiveMembers.length - PREVIEW_MEMBER_LIMIT}** more member${inactiveMembers.length - PREVIEW_MEMBER_LIMIT === 1 ? '' : 's'}.*`
				: '';
		const indexingNotice = indexing ? '\n> ⚠️ Discord is currently indexing server message history; results may be incomplete.' : '';

		const confirmId = `prune_confirm_${interaction.id}`;
		const cancelId = `prune_cancel_${interaction.id}`;

		const previewContainer = new ContainerBuilder()
			.setAccentColor(0xfee75c)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					`### Prune Preview\n**Inactivity:** ${formattedDuration} (no messages since <t:${cutoffSec}:F> / <t:${cutoffSec}:R>)\n**Eligible Checked:** ${candidates.length}\n**Members to Prune:** ${inactiveMembers.length}${indexingNotice}`
				),
				new TextDisplayBuilder().setContent(`**Inactive Members:**\n${previewLines}${overflow}`)
			)
			.addActionRowComponents(
				new ActionRowBuilder<ButtonBuilder>().addComponents(
					new ButtonBuilder()
						.setCustomId(confirmId)
						.setLabel(`Prune ${inactiveMembers.length} Member${inactiveMembers.length === 1 ? '' : 's'}`)
						.setStyle(ButtonStyle.Danger),
					new ButtonBuilder().setCustomId(cancelId).setLabel('Cancel').setStyle(ButtonStyle.Secondary)
				)
			);

		const previewMessage = await interaction.editReply({
			components: [previewContainer],
			flags: MessageFlags.IsComponentsV2,
			allowedMentions: { parse: [] }
		});

		const button = await previewMessage
			.awaitMessageComponent({
				filter: (i) => i.user.id === interaction.user.id && (i.customId === confirmId || i.customId === cancelId),
				componentType: ComponentType.Button,
				time: 60_000
			})
			.catch(() => null);

		if (!button) {
			return interaction
				.editReply({
					components: [textContainer('### Prune Timed Out\nNo members were kicked.')],
					flags: MessageFlags.IsComponentsV2
				})
				.catch(() => null);
		}

		if (button.customId === cancelId) {
			return button.update({
				components: [textContainer('### Prune Cancelled\nNo members were kicked.')],
				flags: MessageFlags.IsComponentsV2
			});
		}

		await button.update({
			components: [
				textContainer(
					`### Pruning Members...\nKicking **${inactiveMembers.length}** inactive member${inactiveMembers.length === 1 ? '' : 's'}...`,
					0xfee75c
				)
			],
			flags: MessageFlags.IsComponentsV2
		});

		let pruned = 0;
		let failed = 0;
		const reason = `Pruned by ${interaction.user.username} (${interaction.user.id}) - inactive for ${formattedDuration}`;

		for (const member of inactiveMembers) {
			try {
				await member.kick(reason);
				pruned++;
			} catch {
				failed++;
			}
		}

		const summary = [
			'### Prune Complete',
			`**Inactivity Threshold:** ${formattedDuration} (no messages since <t:${cutoffSec}:F>)`,
			`**Pruned:** ${pruned} member${pruned === 1 ? '' : 's'}`
		];
		if (failed > 0) summary.push(`**Failed:** ${failed} member${failed === 1 ? '' : 's'} (missing permissions or already left)`);

		return button.editReply({
			components: [textContainer(summary.join('\n'), failed > 0 && pruned === 0 ? 0xed4245 : 0x57f287)],
			flags: MessageFlags.IsComponentsV2,
			allowedMentions: { parse: [] }
		});
	}
}
