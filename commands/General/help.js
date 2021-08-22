const { MessageEmbed } = require('discord.js');
const { prefix } = require('../../config.json');

module.exports = {
    name: 'help',
    aliases: ['h', 'menu', 'cmd'],
    category: 'general',
    description: 'Show all command',
    usage: `${prefix}help\n${prefix}help [command name]`,
    cooldown: 2,
    async execute(client, message, args) {
        if (args[0]) {
            const data = [];
            const name = args[0].toLowerCase();
            const { commands } = message.client;
            const command = commands.get(name) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(name));
            data.push(`**Name**: ${command.name}`)
            if (command.aliases) data.push(`**Aliases**: ${command.aliases.join(', ')}`)
            if (command.description) data.push(`**Description**: ${command.description}`)
            if (command.usage) data.push(`**Usage**: ${command.usage}`)
            if (command.cooldown) data.push(`**Cooldown**: ${command.cooldown}`)

            const embed = new MessageEmbed()
                .setDescription(data.join('\n'))
                .setColor('BLUE')
                .setTimestamp()
                .setFooter(message.author.username, message.author.avatarURL())

            message.channel.send({ embeds: [embed] })

        } else {
            const { commands } = message.client;
            const data = [];
            const category = [];
            const cmdKey = commands.keys();
            for (let key of cmdKey) {
                const cmd = commands.get(key);
                if (!key) continue;
                if (!cmd.category || cmd.category === 'private') continue;
                if (Object.keys(category).includes(cmd.category)) category[cmd.category].push(cmd);
                else {
                    category[cmd.category] = [];
                    category[cmd.category].push(cmd);
                };
            }
            const catKeys = Object.keys(category);
            for (let cat of catKeys) {
                data.push({
                    name: cat.toUpperCase(),
                    value: `${category[cat].map(cmd => `\`${cmd.name}\``).join(", ")}`,
                    inline: true
                })
            }

            const embed = new MessageEmbed()
                .setDescription(`My Commands List\nUse ${prefix}help followed by command name to get detail of command, e.g. ${prefix}help avatar.`)
                .addFields(data)
                .setThumbnail(client.user.avatarURL())
                .setColor('BLUE')
                .setTimestamp()
                .setFooter(message.author.username, message.author.avatarURL())

            message.channel.send({ embeds: [embed] })
        }
    }
}
