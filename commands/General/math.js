const math = require("mathjs");
const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("math")
		.setDescription("Doing math calculation")
		.addStringOption((option) =>
			option.setName("input").setDescription("Input calculus operation e.g 10*20").setRequired(true)
		),
	name: "math",
	cooldown: 2,
	async exec(interaction) {
		await interaction.deferReply();

		let calculus = interaction.options.getString("input"),
			evaluation = math.evaluate(calculus),
			embed = new EmbedBuilder()
				.setTitle("Result")
				.setColor("Blue")
				.addFields([
					{ name: "input", value: "```" + calculus + "```" },
					{ name: "output", value: "```" + evaluation + "```" },
				])
				.setTimestamp();

		interaction.editReply({ embeds: [embed] });
	},
};
