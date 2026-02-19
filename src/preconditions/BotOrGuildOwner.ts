import { Precondition } from '@sapphire/framework';
import type { ChatInputCommandInteraction } from 'discord.js';

export class UserPrecondition extends Precondition {
	public override chatInputRun(interaction: ChatInputCommandInteraction) {
		if (
			interaction.user.id === this.container.client.application?.owner?.id ||
			(interaction.guild && interaction.guild.ownerId === interaction.user.id)
		) {
			return this.ok();
		}

		return this.error({
			identifier: 'Preconditions.BotOrGuildOwner',
			message: 'You must be the bot owner or the guild owner to use this command.'
		});
	}
}

declare module '@sapphire/framework' {
	interface Preconditions {
		BotOrGuildOwner: never;
	}
}
