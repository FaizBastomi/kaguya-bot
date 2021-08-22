const { MessageEmbed } = require('discord.js');
const anime = require('random-anime');

module.exports = {
    name: 'nsfw',
    description: 'Send Random Hentai Image',
    category: 'anime',
    cooldown: 2,
    async execute(client, message, args) {
        if (!message.channel.nsfw) {
            return message.channel.send('This command only can be execute on nsfw channel!')
        } else {
            const embed = new MessageEmbed()
                .setImage(anime.nsfw())
                .setColor('BLUE')
                .setTimestamp()
                .setFooter('Random NSFW')

            message.channel.send({ embeds: [embed] })
        }
    }

}