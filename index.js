const Discord = require('discord.js');
const { prefix, TOKEN } = require('./config.json');
const fs = require('fs');
const client = new Discord.Client();

client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();
client.prefix = prefix;

const commandFiles = fs.readdirSync(`./commands`).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

client.login(TOKEN).catch(() => { console.log('Invaid TOKEN!') });

client.once('ready', async () => {
    console.log(`Ready!, login as ${client.user.username}`)
    client.user.setPresence({
        status: "online"
    });
    client.user.setActivity(`${prefix}help for more info!`, { type: "PLAYING" });
})

client.on('warn', info => console.log(info));
client.on('error', console.error);

client.on('message', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot || message.channel.type === 'dm') return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    if (!cooldowns.has(command.name)) {
        cooldowns.set(command.name, new Discord.Collection());
    }

    const now = Date.now();
    const timestamps = cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;

    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            return (await message.reply(`Please wait ${timeLeft.toFixed(1)} second(s) until next command!`))
            .then(msg => msg.delete({timeout: 2000}));
        }
    }

    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

try {
    command.execute(client, message, args)
} catch (error) {
	console.error(error);
	message.reply('there was an error trying to execute that command!');
}
});
