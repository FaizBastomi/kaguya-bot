/** Only for pm2  users */
const { owner } = require('../../config.json')
const pm2 = require('pm2')

module.exports = {
    name: 'restart',
    aliases: ['r'],
    category: 'private',
    description: 'Restart bot.',
    async execute(client, message, args) {
        if (message.author.id !== owner) return message.channel.send('You can\'t execute this command')
        pm2.restart('index', (err) => {
            if (err) {
                console.log(err)
            }
        })
        message.channel.send('success')
    }
}