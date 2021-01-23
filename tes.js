const fs = require('fs')

const diri = [
    "General",
    "Private",
    "Anime"
]

const file = fs.readdirSync('./commands/General').filter(file => file.endsWith('.js'))
console.log(file)