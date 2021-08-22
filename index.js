const Discord = require('discord.js');
const { prefix, TOKEN } = require('./config.json');
const client = new Discord.Client({ intents: ["GUILDS","GUILD_MESSAGES","GUILD_MEMBERS","GUILD_PRESENCES","GUILD_MESSAGE_REACTIONS"] });

client.commands = new Discord.Collection();
const cooldowns = new Discord.Collection();
client.prefix = prefix;

function readCmd() {
    const fs = require('fs');
    const dir = fs.readdirSync('./commands');
    dir.forEach((dir) => {
        const files = fs.readdirSync(`./commands/${dir}`).filter(file => file.endsWith('.js'))
        for (let file of files) {
            const cmd = require(`./commands/${dir}/${file}`)
            client.commands.set(cmd.name, cmd)
        }
    })
    console.log('Command Loaded')
}
readCmd();

client.login(TOKEN).catch(() => { console.log('Invaid TOKEN!') });

client.once('ready', async () => {
    console.log(`Ready!, login as ${client.user.username}`)
    client.user.setPresence({
        status: "online"
    });
    setInterval(() => {
        const activity = [
            { name: `${prefix}help for more info!`, type: "PLAYING" },
            { name: "Made with 💝 for you.", type: "STREAMING", url: "https://www.youtube.com/watch?v=BR-aIzE3QI0" }
        ];
        const act2 = activity[Math.floor(Math.random() * activity.length)];
        client.user.setActivity(act2);
    }, 10*1000);
})

client.on('warn', info => console.log(info));
client.on('error', console.error);

client.on('messageCreate', async message => {
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
