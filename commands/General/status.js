const discord = require('discord.js');
const ms = require('ms')

module.exports = {
    name: 'status',
    aliases: ['stats', 'stat', 'info'],
    category: 'general',
    description: 'Check Bot Status',
    async execute(client, message, args) {
        const embed = new discord.MessageEmbed()
            .setTitle('Information')
            .setDescription(`
**Name**: ${client.user.username}
**ID**: ${client.user.id}
\`\`\`
Memory    : ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
Node.js   : ${process.version}
Discord.js: ${discord.version}
Uptime    : ${ms(client.uptime, { long: true })}
\`\`\``)

        message.channel.send({ embeds: [embed] })
    }
}