import { ApplyOptions } from '@sapphire/decorators';
import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, ContainerBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, MessageFlags } from 'discord.js';

@ApplyOptions<InteractionHandler.Options>({
	interactionHandlerType: InteractionHandlerTypes.Button
})
export class ButtonHandler extends InteractionHandler {
	public override parse(interaction: ButtonInteraction) {
		if (interaction.customId.startsWith('whois_avatar_')) return this.some({ userId: interaction.customId.replace('whois_avatar_', '') });
		return this.none();
	}

	public async run(interaction: ButtonInteraction, result: { userId: string }) {
		const user = await this.container.client.users.fetch(result.userId).catch(() => null);
		if (!user) return interaction.reply({ content: 'User not found.', flags: MessageFlags.Ephemeral });

		const avatarUrl = user.displayAvatarURL({ size: 4096, extension: 'png' });
		const mediaGallery = new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(avatarUrl));
		const container = new ContainerBuilder().addMediaGalleryComponents(mediaGallery);

		return interaction.reply({ components: [container], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral });
	}
}
