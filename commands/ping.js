const { MessageEmbed } = require('discord.js')

module.exports = {
    name: 'ping',
    description: '-',
    async execute(client, message, args) {
        const m = await message.channel.send('Pinging...')

        const embed = new MessageEmbed()
        .setTitle('Pong')
        .addField('⏳ Latency', `_**${m.createdTimestamp - message.createdTimestamp}ms**_`)
        .addField('💓 API', `_**${client.ws.ping}ms**_`)
        .setColor('BLUE')
        .setTimestamp()
        
        return m.edit('Done!', {embed: embed})
    }
}