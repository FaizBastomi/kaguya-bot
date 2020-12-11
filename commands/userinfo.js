const { MessageEmbed } = require('discord.js')

module.exports = {
    name: 'userinfo',
    description: 'User information~',
    async execute(client, message, args) {
        const user = message.mentions.users.first() || message.author;

        const embed = new MessageEmbed()
        .setColor('BLUE')
        .setImage(user.displayAvatarURL({ size: 4096, format: 'png', dynamic: true }))
        .addField('Username', user.username)
        .addField('User Id', user.id)
        .addField('Account Created', user.createdAt)
        .addField('Status', user.presence.status)
        .addField('Account Type', `${user.bot ? 'Bot' : 'Human'}`)

        message.channel.send(embed)
    }
}