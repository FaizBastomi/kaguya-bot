const { MessageEmbed } = require('discord.js');
const { prefix } = require('../../config.json');

module.exports = {
    name: 'avatar',
    aliases: ['ava','icon','photo'],
    cooldown: 2,
    description: 'Show your avatar',
    usage: `${prefix}avatar or ${prefix}avatar @tag`,
    async execute(client, message, args) {
        const mentioned = message.mentions.users.first() || message.author;

        const embed = new MessageEmbed()
        .setImage(mentioned.displayAvatarURL({ size: 4096, format: 'png', dynamic: true }))
        .setColor('BLUE')
        .setTimestamp()
        .setDescription(`[\`link avatar\`](${mentioned.displayAvatarURL({ size: 4096, format: 'png', dynamic: true })})`)
        .setFooter(`Avatar of ${mentioned.tag}`)

        message.channel.send(embed)
    }
}