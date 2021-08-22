const { MessageEmbed } = require('discord.js');
const anime = require('random-anime');

module.exports = {
    name: 'anime',
    aliases: ['randanime', 'anim'],
    category: 'anime',
    description: 'Send Random Anime Image',
    cooldown: 2,
    async execute(client, message, args) {
        const embed = new MessageEmbed()
            .setImage(anime.anime())
            .setColor('BLUE')
            .setTimestamp()
            .setFooter('Random Anime')

        message.channel.send({ embeds: [embed] })
    }

}
