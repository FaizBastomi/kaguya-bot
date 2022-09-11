const { EmbedBuilder, SlashCommandBuilder, version } = require("discord.js");
const ms = require("ms");

module.exports = {
	data: new SlashCommandBuilder().setName("status").setDescription("Bot Status"),
	name: "status",
	async exec(interaction) {
		await interaction.deferReply();

		let embed = new EmbedBuilder()
			.setTitle("Information")
			.setDescription(
				`
**Name**: ${interaction.client.user.username}
**ID**: ${interaction.client.user.id}
\`\`\`
Memory    : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
Node.js   : ${process.version}
Discord.js: ${version}
Uptime    : ${ms(interaction.client.uptime, { long: true })}
\`\`\``
			)
			.setTimestamp();

		interaction.editReply({ embeds: [embed] });
	},
};
