const math = require('mathjs');

const { Command } = require('@sapphire/framework');
const { EmbedBuilder } = require('discord.js');

const { config } = require('../../index');

class MathCommand extends Command {
	constructor(ctx, options) {
		super(ctx, {
			...options,
			name: 'math',
			description: 'Doing math calculation',
			cooldownDelay: 5
		});
	}

	registerApplicationCommands(registry) {
		registry.registerChatInputCommand(
			(builder) =>
				builder //
					.setName(this.name)
					.setDescription(this.description)
					.addStringOption((option) =>
						option //
							.setName('input')
							.setDescription('Input calculus operation e.g 10*20')
							.setRequired(true)
					),
			{
				idHints: config.data?.[this.name + 'ID'] || '',
				registerCommandIfMissing: true
			}
		);
	}

	async chatInputRun(interaction) {
		await interaction.deferReply();

		const calculus = interaction.options.getString('input');
		const evaluation = math.evaluate(calculus);
		const embed = new EmbedBuilder()
			.setTitle('Result')
			.setColor('Blue')
			.addFields([
				{ name: 'input', value: '```' + calculus + '```' },
				{ name: 'output', value: '```' + evaluation + '```' }
			])
			.setTimestamp();

		return interaction.editReply({ embeds: [embed] });
	}
}

module.exports = {
	MathCommand
};
