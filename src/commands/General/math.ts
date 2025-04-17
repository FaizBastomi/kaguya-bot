import { ApplyOptions } from '@sapphire/decorators';
import { Command } from '@sapphire/framework';
import { ApplicationIntegrationType, EmbedBuilder, InteractionContextType } from 'discord.js';

@ApplyOptions<Command.Options>({
	name: 'math',
	description: 'do math',
	cooldownDelay: 5 * 1000
})
export class MathCommand extends Command {
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
						.setName('expression')
						.setDescription('The math expression to evaluate, e.g 1*2')
						.setRequired(true)
				)
		);
	}

	public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
		await interaction.deferReply();

		try {
			const expression = interaction.options.getString('expression', true);
			const { evaluate } = await import('mathjs');
			const result = evaluate(expression);
			const embed = new EmbedBuilder()
				.setTitle('Result')
				.setColor('#d5d8df')
				.setFields([
					{ name: 'input', value: '```' + expression + '```' },
					{ name: 'output', value: '```' + result + '```' }
				])
				.setTimestamp();

			return interaction.editReply({ embeds: [embed] });
		} catch (error) {
			return interaction.editReply('Invalid expression');
		}
	}
}
