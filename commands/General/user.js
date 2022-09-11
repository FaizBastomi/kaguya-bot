const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("user")
		.setDescription("Get user information")
		.addSubcommand((subCommand) =>
			subCommand
				.setName("avatar")
				.setDescription("Get user avatar")
				.addUserOption((option) =>
					option.setName("user").setDescription("Other guild member").setRequired(false)
				)
		)
		.addSubcommand((subCommand) =>
			subCommand
				.setName("info")
				.setDescription("Get detailed user information")
				.addUserOption((option) =>
					option.setName("user").setDescription("Other guild member").setRequired(false)
				)
		),
	name: "user",
	cooldown: 2,
	async exec(interaction) {
		await interaction.deferReply();

		let users = null,
			embeds = null;

		if (interaction.options.getSubcommand() === "avatar") {
			users = interaction.options.getUser("user") || interaction.user;
			embeds = new EmbedBuilder()
				.setTitle(users.username + "#" + users.discriminator)
				.setColor("Blue")
				.setImage(users.displayAvatarURL({ extension: "png", size: 4096 }))
				.setTimestamp();
		} else if (interaction.options.getSubcommand() === "info") {
			users = interaction.options.getUser("user") || interaction.user;
			embeds = new EmbedBuilder()
				.setTitle("User Information")
				.setColor("Blue")
				.setThumbnail(users.displayAvatarURL({ extension: "png", size: 4096 }))
				.addFields([
					{ name: "Username", value: users.username, inline: true },
					{ name: "Discriminator", value: "#" + users.discriminator, inline: true },
					{ name: "User ID", value: users.id },
				])
				.setTimestamp();
		}
		interaction.editReply({ embeds: [embeds] });
	},
};
