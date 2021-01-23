const { MessageEmbed } = require('discord.js');
const { prefix } = require('../../config.json');
const axios = require('axios');

module.exports = {
    name: 'shota',
    description: 'Send Random Shota Images',
    usage: `${prefix}shota`,
    cooldown: 2,
    async execute(client, message, args) {
        axios.get('https://tobz-api.herokuapp.com/api/randomshota?apikey=BotWeA')
        .then((res) => {
            const embed = new MessageEmbed()
            .setImage(res.data.result)
            .setColor('BLUE')
            .setTimestamp()
            .setFooter('Random Shota')

            message.channel.send(embed)
        })
    }
}