const { prefix } = require('../../config.json');

module.exports = {
    name: 'clear',
    aliases: ['c', 'del', 'delete'],
    category: 'general',
    description: 'Delete amount of message',
    usage: `${prefix}clear \`10\``,
    cooldown: 2,
    async execute(client, message, args) {
        if (!args.length) {
            setTimeout(() => { message.delete() }, 3000);
            message.channel.send('Please, provide the number!').then(msg => setTimeout(() => { msg.delete() }, 3000));
        } else {
            message.delete();
            message.channel.bulkDelete(args[0], { filterOld: true });
            message.channel.send('Success!').then(msg => setTimeout(() => { msg.delete() }, 3000)).catch((err) => { console.log(err.message) });
        }
    }
}
