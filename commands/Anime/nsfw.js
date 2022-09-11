const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const anime = require("random-anime");

module.exports = {
	data: new SlashCommandBuilder().setName("nsfw").setDescription("Get random NSFW anime image"),
	name: "nsfw",
	cooldown: 2,
	async exec(interaction) {
		if (!interaction.channel.nsfw) {
			return interaction.reply({ content: "This command only can be execute on nsfw channel!", ephemeral: true });
		}

		let embed = new EmbedBuilder()
			.setImage(anime.nsfw())
			.setColor("Red")
			.setTimestamp()
			.setFooter({ text: "Random NSFW" });

		interaction.reply({ embeds: [embed] });
	},
};
