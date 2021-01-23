const { MessageEmbed, Message } = require('discord.js')
const axios = require('axios')
const { prefix } = require('../../config.json')

module.exports = {
    name: 'husbu',
    description: 'Random Husbu',
    cooldown: 2,
    usage: `${prefix}husbu`,
    async execute(client, message, args) {
        axios.get('https://tobz-api.herokuapp.com/api/husbu?apikey=BotWeA')
        .then((res) => {
            const embed = new MessageEmbed()
            .setImage(res.data.image)
            .setDescription(`**${res.data.name}**`)
            .setTimestamp()
            .setFooter('Random Husbu')
            .setColor('BLUE')

            message.channel.send(embed)
        })
    }
}