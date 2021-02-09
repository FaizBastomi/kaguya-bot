const { MessageEmbed } = require('discord.js')
const { fetchJson } = require('../Utils/fetcher')
const { prefix } = require('../../config.json')

module.exports = {
    name: "fetish",
    description: "Get image from a given subreddit or will pick random image from random subreddit.",
    cooldown: 5,
    usage: `${prefix}fetish [subreddit]`,
    async execute(client, message, args) {
        if (!message.channel.nsfw) {
            message.channel.send('This command only can be execute on nsfw channel!')
        }
        const randSub = ['ecchi', 'lewdanimegirls', 'hentai', 'hentaifemdom', 'hentaiparadise', 'hentai4everyone', 'animearmpits', 'animefeets', 'animethighss', 'animebooty', 'biganimetiddies', 'animebellybutton', 'sideoppai', 'ahegao']
        const tag = randSub[Math.floor(Math.random() * randSub.length)]
        if (args.length < 1) {
            var tags = tag
        } else {
            var tags = args[0]
        }
        const m = await message.channel.send(`**Search image from ${tags}...**`)
        fetchJson(`https://meme-api.herokuapp.com/gimme/${tags}`).then(async (res) => {
            const { title, url, author } = res
            const embed = new MessageEmbed()
            .setTitle(title)
            .setImage(url)
            .setColor('BLUE')
            .setTimestamp()
            .setFooter('Some Fetish')

            return m.edit(embed)
        })
    }
}