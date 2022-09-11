const { REST } = require("@discordjs/rest");
const { Routes } = require("discord.js");
const { TOKEN, ClientId } = require("./config.json");
const fs = require("node:fs");
const path = require("node:path");

const commands = [];

const dir = fs.readdirSync(path.join(__dirname, "commands"));
dir.forEach((dir) => {
	const files = fs.readdirSync(path.join(__dirname, "commands", dir)).filter((file) => file.endsWith(".js"));
	for (let file of files) {
		const cmd = require(path.join(__dirname, "commands", dir, file));
		if (cmd.data) {
			commands.push(cmd.data.toJSON());
		}
	}
});

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		const data = await rest.put(Routes.applicationCommands(ClientId), { body: commands });

		console.log(`Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();
