const { prefix } = require('../../config.json');

module.exports = {
    name: 'clear',
    aliases: ['c','del','delete'],
    description: 'Delete amount of message',
    usage: `${prefix}clear \`10\``,
    cooldown: 2,
    async execute(client, message, args) {
        if (!args.length) {
            message.delete({timeout: 3000});
            message.channel.send('Please, provide the number!').then(msg => msg.delete({timeout: 3000}));
        } else {
            message.delete();
        message.channel.bulkDelete(args[0]);
        message.channel.send('Success!').then(msg => msg.delete({timeout: 3000})).catch((err) => { console.log(err.message) });
        }
    }
}
