import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import {
	ApplicationIntegrationType,
	ContainerBuilder,
	InteractionContextType,
	MediaGalleryBuilder,
	MediaGalleryItemBuilder,
	MessageFlags,
	TextDisplayBuilder
} from 'discord.js';
import { cleanUrl, processor } from '../../lib/services/replayProcessor';

@ApplyOptions<Command.Options>({
	name: 'replay',
	description: 'Download Instagram and Facebook media from URL',
	cooldownDelay: 5 * 1000
})
export class ReplayCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
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
				.addStringOption((option) =>
					option //
						.setName('url')
						.setDescription('The Instagram, Facebook, or TikTok URL to replay/download')
						.setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const url = cleanUrl(interaction.options.getString('url', true));

		const handler = processor.getHandler(url);
		if ('error' in handler) return interaction.reply({ content: handler.error, flags: MessageFlags.Ephemeral });

		await interaction.deferReply();

		try {
			const mediaUrls = await handler.fetch(url);
			if (!mediaUrls?.length) return interaction.editReply({ content: 'Failed to retrieve media from the provided URL.' });

			const processedUrls = handler.postProcess ? handler.postProcess(mediaUrls, url) : mediaUrls;
			const title = `### ${handler.name}`;

			for (let i = 0; i < processedUrls.length; i += 10) {
				const chunk = processedUrls.slice(i, i + 10);
				const mediaGallery = new MediaGalleryBuilder().addItems(...chunk.map((u) => new MediaGalleryItemBuilder().setURL(u)));
				const container = new ContainerBuilder();
				if (i === 0) container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${title}\n[Original URL](${url})`));
				container.addMediaGalleryComponents(mediaGallery);

				const send = (i === 0 ? interaction.editReply : interaction.followUp).bind(interaction);
				await send({ components: [container], flags: MessageFlags.IsComponentsV2 as const }).catch(() => send({ content: chunk.join('\n') }));
			}

			return;
		} catch (error) {
			this.container.logger.error(error);
			return interaction.editReply({ content: 'An error occurred while fetching media from LoLhuman API.' });
		}
	}
}
