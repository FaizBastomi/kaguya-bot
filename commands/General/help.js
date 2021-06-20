const { MessageEmbed } = require('discord.js');
const { prefix } = require('../../config.json');
const fs = require('fs');

module.exports = {
    name: 'help',
    aliases: ['h','menu','cmd'],
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
            .setDescription(data)
            .setColor('BLUE')
            .setTimestamp()
            .setFooter(message.author.username, message.author.avatarURL())
            
            message.channel.send(embed)
            
        } else {
        const data = [];
        fs.readdirSync('./commands').forEach((dir) => {
            const cmd = fs.readdirSync(`./commands/${dir}`).filter(file =>
                file.endsWith('.js')
            )
            const cmds = cmd.map((cmd) => {
                const file = require(`../../commands/${dir}/${cmd}`)
                if (!file.name) return;
                let name = file.name.replace('.js', '')
                return `\`${name}\``
            })
            let obj = new Object();
            obj = {
                name: dir.toUpperCase(),
                value: cmds.join(', ')
            }
            data.push(obj)
        })

        const embed = new MessageEmbed()
        .setDescription(`My Commands List\nUse ${prefix}help followed by command name to get detail of command, e.g. ${prefix}help avatar.`)
        .addFields(data)
        .setThumbnail(client.user.avatarURL())
        .setColor('BLUE')
        .setTimestamp()
        .setFooter(message.author.username, message.author.avatarURL())

        message.channel.send(embed)
        }
    }
}
