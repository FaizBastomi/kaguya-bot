import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, InteractionContextType } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'ping',
	description: 'ping pong'
})
export class UserCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		const integrationTypes: ApplicationIntegrationType[] = [ApplicationIntegrationType.GuildInstall];
		const contexts: InteractionContextType[] = [InteractionContextType.Guild];

		registry.registerChatInputCommand((builder) =>
			builder //
				.setName(this.name)
				.setDescription(this.description)
				.setIntegrationTypes(integrationTypes)
				.setContexts(contexts)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		return this.sendPing(interaction);
	}

	private async sendPing(interactionOrMessage: Command.ChatInputCommandInteraction) {
		const pingMessage = await interactionOrMessage.reply({ content: 'Ping?', fetchReply: true });

		if (!pingMessage) return;

		const content = `Pong! Bot Latency ${Math.round(this.container.client.ws.ping)}ms. API Latency ${
			pingMessage.createdTimestamp - interactionOrMessage.createdTimestamp
		}ms.`;

		return interactionOrMessage.editReply({
			content
		});
	}
}
