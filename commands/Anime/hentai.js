const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const { UserAgent } = require('../../config.json');

module.exports = {
    name: 'hentai',
    aliases: [],
    category: 'anime',
    description: 'Send Random Hentai Image',
    cooldown: 2,
    async execute(client, message, args) {
        if (!message.channel.nsfw) {
            return message.channel.send('This command only can be execute on nsfw channel!')
        } else {
            axios.get('https://nekos.life/api/v2/img/hentai', { headers: { 'User-Agent': `${UserAgent}` } })
                .then((res) => {
                    const embed = new MessageEmbed()
                        .setImage(res.data.url)
                        .setColor('BLUE')
                        .setTimestamp()
                        .setFooter('Random Hentai')

                    message.channel.send({ embeds: [embed] })
                })
        }
    }

}