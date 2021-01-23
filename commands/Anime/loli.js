const { MessageEmbed } = require('discord.js');
const { prefix } = require('../../config.json');
const axios = require('axios');

module.exports = {
    name: 'loli',
    aliases: ['randloli','lolis'],
    description: 'Send Random Lolis Images',
    usage: `${prefix}loli`,
    cooldown: 2,
    async execute(client, message, args) {
        axios.get('https://tobz-api.herokuapp.com/api/randomloli?apikey=BotWeA')
        .then((res) => {
            const embed = new MessageEmbed()
            .setImage(res.data.result)
            .setColor('BLUE')
            .setTimestamp()
            .setFooter('Random Lolis')

            message.channel.send(embed)
        })
    }
}