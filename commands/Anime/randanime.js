const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const anime = require("random-anime");

module.exports = {
	data: new SlashCommandBuilder().setName("anime").setDescription("Get random anime image"),
	name: "anime",
	cooldown: 2,
	async exec(interaction) {
		let embed = new EmbedBuilder()
			.setImage(anime.anime())
			.setColor("Blue")
			.setTimestamp()
			.setFooter({ text: "Random Anime" });

		interaction.reply({ embeds: [embed] });
	},
};
