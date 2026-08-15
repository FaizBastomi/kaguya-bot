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
		if (!inputUrl.includes('?') && inputUrl.includes('&')) inputUrl = inputUrl.replace('&', '?');
		const parsed = new URL(inputUrl);
		for (const key of parsed.searchParams.keys()) {
			if (/^(igs[hi]|utm_|fbclid|gclid|mibextid|share_id|ref|si?|s)/i.test(key)) parsed.searchParams.delete(key);
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
		const url = cleanUrl(interaction.options.getString('url', true));
		const isInstagram = /instagram\.com|instagr\.am/i.test(url);
		const isFacebook = /facebook\.com|fb\.watch|fb\.com/i.test(url);

		const replyError = (content: string) => interaction.reply({ content, flags: MessageFlags.Ephemeral });
		if (!isInstagram && !isFacebook) return replyError('Please provide a valid Instagram or Facebook URL.');
		if (isFacebook && !/(\/v\/|\/videos\/|[\/?&]v=|fb\.watch|\/reel\/|\/r\/)/i.test(url)) {
			return replyError('Only video URLs are supported for Facebook.');
		}

		await interaction.deferReply();

		try {
			let mediaUrls = isInstagram ? await getInstagramMedia(url) : await getFacebookMedia(url);
			if (!mediaUrls?.length) return interaction.editReply({ content: 'Failed to retrieve media from the provided URL.' });

			if (isFacebook) mediaUrls = [mediaUrls[0]];
			else if (/reel/i.test(url)) mediaUrls = [mediaUrls.find((u) => /mp4/i.test(u)) || mediaUrls[0]];

			const title = isInstagram ? '### Instagram' : '### Facebook';

			for (let i = 0; i < mediaUrls.length; i += 10) {
				const chunk = mediaUrls.slice(i, i + 10);
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
