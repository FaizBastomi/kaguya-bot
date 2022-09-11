const { Client, GatewayIntentBits, Collection, ActivityType } = require("discord.js");
const { TOKEN } = require("./config.json");
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMembers,
	],
});
const fs = require("node:fs");
const path = require("node:path");

client.commands = new Collection();
const cooldowns = new Collection();

function readCmd() {
	const dir = fs.readdirSync(path.join(__dirname, "commands"));
	dir.forEach((dir) => {
		const files = fs.readdirSync(path.join(__dirname, "commands", dir)).filter((file) => file.endsWith(".js"));
		for (let file of files) {
			const cmd = require(path.join(__dirname, "commands", dir, file));
			client.commands.set(cmd.name, cmd);
		}
	});
	console.log("Command Loaded");
}
readCmd();

/* Login */
client.login(TOKEN).catch(() => {
	console.log("Invaid TOKEN!");
});

client.once("ready", async () => {
	console.log(`Ready!, login as ${client.user.username}`);
	client.user.setPresence({
		status: "online",
	});
	client.user.setActivity({ name: `/help for more info!`, type: ActivityType.Playing });
});

client.on("warn", (info) => console.log(info));
client.on("error", console.error);

client.on("interactionCreate", async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);
	if (!command) return;

	/* Cooldown things */
	if (!cooldowns.has(command.name)) {
		cooldowns.set(command.name, new Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.name);
	const cooldownAmount = (command.cooldown || 3) * 1000;

	if (timestamps.has(interaction.user.id)) {
		const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

		if (now < expirationTime) {
			const timeLeft = (expirationTime - now) / 1000;
			return await interaction
				.reply({ content: `Please wait ${timeLeft.toFixed(1)} second(s) until next command!` })
				.then((it) => {
					it.interaction.deleteReply();
				});
		}
	}

	timestamps.set(interaction.user.id, now);
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

	try {
		command.exec(interaction);
	} catch (e) {
		console.error(e);
	}
});
