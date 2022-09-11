const { SlashCommandBuilder } = require("discord.js");
const wait = require("node:timers/promises").setTimeout;

module.exports = {
	data: new SlashCommandBuilder()
		.setName("clear")
		.setDescription("Bulk delete message in channel")
		.addNumberOption((option) =>
			option.setName("number").setDescription("Number of message e.g 20").setRequired(true)
		),
	name: "clear",
	cooldown: 2,
	async exec(interaction) {
		await interaction.deferReply({ ephemeral: true });

		let total = interaction.options.getNumber("number");
		await interaction.channel.bulkDelete(total, true);

		interaction.editReply("DONE!");
	},
};
