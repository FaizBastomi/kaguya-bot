const { MessageEmbed } = require('discord.js')

module.exports = {
    name: 'userinfo',
    category: 'general',
    description: 'User information~',
    async execute(client, message, args) {
        const user = message.mentions.users.first() || message.author;

        const embed = new MessageEmbed()
            .setColor('BLUE')
            .setImage(user.displayAvatarURL({ size: 4096, dynamic: true }))
            .addField('Username', user.username)
            .addField('User Id', user.id)
            .addField('Account Type', `${user.bot ? 'Bot' : 'Human'}`)

        message.channel.send({ embeds: [embed] })
    }
}