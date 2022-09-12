const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require("discord.js");
const { fetchJson } = require("../../Utils/fetcher");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("fetish")
		.setDescription("Get image from subreddit")
		.addStringOption((option) =>
			option
				.setName("category")
				.setDescription("fetish category")
				.addChoices(
					{ name: "armpits", value: "animearmpits" },
					{ name: "feets", value: "animefeets" },
					{ name: "genshin", value: "genshinimpacthentai" },
					{ name: "tiddies", value: "biganimetiddies" },
					{ name: "bellybutton", value: "animebellydancers" },
					{ name: "ahegao", value: "ahegao" }
				)
		),
	name: "fetish",
	cooldown: 5,
	async exec(interaction) {
		if (!interaction.channel.nsfw) {
			return interaction.reply({ content: "This command only can be execute on nsfw channel!", ephemeral: true });
		}
		const randSub = [
			"ecchi",
			"lewdanimegirls",
			"hentai",
			"hentaifemdom",
			"animearmpits",
			"animefeets",
			"animebooty",
			"biganimetiddies",
			"animebellydancers",
			"sideoppai",
			"ahegao",
		];
		let tag = interaction.options.getString("category") || randSub[Math.floor(Math.random() * randSub.length)];

		await interaction.reply(`**Search image from ${tag}...**`);
		let result = await fetchJson(`https://meme-api.herokuapp.com/gimme/${tag}`),
			embed = new EmbedBuilder()
				.setAuthor({ name: result.author, url: "https://reddit.com/u/" + result.author })
				.setTitle(result.title)
				.setURL(result.postLink)
				.setImage(result.url)
				.setColor("Red")
				.setTimestamp();
		row = new ActionRowBuilder().addComponents(
			new ButtonBuilder().setLabel("Post").setURL(`${result.postLink}`).setStyle(ButtonStyle.Link),
			new ButtonBuilder()
				.setLabel("Author")
				.setURL(`https://reddit.com/u/${result.author}`)
				.setStyle(ButtonStyle.Link)
		);

		interaction.editReply({ content: "", embeds: [embed], components: [row] });
	},
};
