const { MessageEmbed } = require('discord.js');
const { prefix } = require('../../config.json')
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
        const { commands } = message.client;
        data.push(`My prefix is **${prefix}**\nHere all my command:`);
        data.push(commands.map(command => `\`${command.name}\``).join(', '));
        data.push(`\nYou can do n!help [command name] to view detail of command`);

        const embed = new MessageEmbed()
        .setDescription(data)
        .setThumbnail(client.user.avatarURL())
        .setColor('BLUE')
        .setTimestamp()
        .setFooter(message.author.username, message.author.avatarURL())

        message.channel.send(embed)
        }
    }
}
