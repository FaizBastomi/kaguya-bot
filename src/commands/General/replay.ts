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
import { getFacebookMedia, getInstagramMedia } from '../../lib/services/lolhuman';

function cleanUrl(inputUrl: string): string {
	try {
		const parsed = new URL(inputUrl);
		for (const key of [...parsed.searchParams.keys()]) {
			if (/^(igsh|utm_|fbclid|gclid|mibextid|share_id|ref|si?|s)/i.test(key)) parsed.searchParams.delete(key);
		}
		return parsed.toString();
	} catch {
		return inputUrl;
	}
}

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
						.setDescription('The Instagram or Facebook URL to replay/download')
						.setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		const rawUrl = interaction.options.getString('url', true);
		const url = cleanUrl(rawUrl);

		const isInstagram = /instagram\.com|instagr\.am/i.test(url);
		const isFacebook = /facebook\.com|fb\.watch|fb\.com/i.test(url);

		if (!isInstagram && !isFacebook) {
			return interaction.reply({
				content: 'Please provide a valid Instagram or Facebook URL.',
				flags: MessageFlags.Ephemeral
			});
		}

		if (isFacebook && !/(\/v\/|\/videos\/|[\/?&]v=|fb\.watch|\/reel\/|\/r\/)/i.test(url)) {
			return interaction.reply({
				content: 'Only video URLs are supported for Facebook.',
				flags: MessageFlags.Ephemeral
			});
		}

		await interaction.deferReply();

		try {
			let mediaUrls = isInstagram ? await getInstagramMedia(url) : await getFacebookMedia(url);

			if (!mediaUrls || mediaUrls.length === 0) {
				return interaction.editReply({ content: 'Failed to retrieve media from the provided URL.' });
			}

			if (isFacebook) {
				mediaUrls = [mediaUrls[0]];
			} else if (isInstagram && /reel/i.test(url)) {
				const videoUrl = mediaUrls.find((mediaUrl) => /mp4/i.test(mediaUrl)) ?? mediaUrls[0];
				mediaUrls = [videoUrl];
			}

			const title = isInstagram ? '### Instagram' : '### Facebook';
			const textDisplay = new TextDisplayBuilder().setContent(`${title}\n[Original URL](${url})`);

			const galleries: MediaGalleryBuilder[] = [];
			for (let i = 0; i < mediaUrls.length; i += 10) {
				galleries.push(
					new MediaGalleryBuilder().addItems(
						...mediaUrls.slice(i, i + 10).map((mediaUrl) => new MediaGalleryItemBuilder().setURL(mediaUrl))
					)
				);
			}

			const container = new ContainerBuilder().addTextDisplayComponents(textDisplay).addMediaGalleryComponents(...galleries);

			try {
				return await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
			} catch {
				return await interaction.editReply({ content: mediaUrls.join('\n') });
			}
		} catch (error) {
			this.container.logger.error(error);
			return interaction.editReply({ content: 'An error occurred while fetching media from LoLhuman API.' });
		}
	}
}
