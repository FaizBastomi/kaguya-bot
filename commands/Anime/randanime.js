const { MessageEmbed } = require('discord.js');
const axios = require('axios');
const { UserAgent } = require('../../config.json')

module.exports = {
    name: 'anime',
    aliases: ['randanime','anim'],
    description: 'Send Random Anime Image',
    cooldown: 2,
    async execute(client, message, args) {
            axios.get('https://api.computerfreaker.cf/v1/anime', { headers: { 'User-Agent': `${UserAgent}`} } )
            .then((res) => {
            const embed = new MessageEmbed()
            .setImage(res.data.url)
            .setColor('BLUE')
            .setTimestamp()
            .setFooter('Random Anime')

            message.channel.send(embed)
            })
    }

}
