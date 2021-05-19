/** Only for pm2  users */
const { owner } = require('../../config.json')
const { exec } = require('child_process')

module.exports = {
    name: 'restart',
    aliases: ['r'],
    description: 'Restart bot.',
    async execute(client, message, args) {
        if (message.author.id !== owner) return message.channel.send('You can\'t execute this command')
        exec('pm2 restart index', function(err) {
            if (err) return message.channel.send('Something wrong while restarting bot.')
            message.channel.send('Sucess restart bot.')
        })
    }
}