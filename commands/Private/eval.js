const { MessageEmbed } = require('discord.js')
const { owner } = require('../../config.json')
module.exports = {
    name: 'eval',
    description: '',
    async execute(client, message, args) {
      if (!owner) return message.channel.send('Can\'t execute this command!')
      
      const msg = message;
      
      const bot = client;
  
      const evalEmbed = new MessageEmbed()
      .setThumbnail(message.author.displayAvatarURL())
      .setColor("BLUE");
  
      let code = args.join(" ");
      
      try {
        const input = clean(code);
  
        if (!code) return msg.channel.send("What you'r **JavaScript Codes** ?");
  
        evalEmbed.addField("Input", `\`\`\`js\n${input}\n\`\`\``);
  
        let evaled;
  
        if (code.includes("--silent") && code.includes("--async")) {
          code = code.replace("--async", "").replace("--silent", "");
  
          return await eval(`(async () => { ${code} })()`);
        } else if (code.includes("--async")) {
          code = code.replace("--async", "");
  
          evaled = await eval(`(async () => { ${code} })()`);
        } else if (code.includes("--silent")) {
          code = code.replace("--silent", "");
  
          return await eval(code);
        } else evaled = await eval(code);
  
        if (typeof evaled !== "string")
          evaled = require("util").inspect(evaled, { depth: 0 });
  
        let output = clean(evaled);
  
        output = output.replace(new RegExp(client.token, "g"), "[TOKEN]");
        output = output.replace(new RegExp(bot.token, "g"), "[TOKEN]");
  
        if (code.includes("--no-embed")) {
          code = code.replace("--no-embed", "");
  
          return msg.channel.send(`\`\`\`js\n${output}\n\`\`\``);
        }
  
        evalEmbed.addField("Output", `\`\`\`js\n${output}\n\`\`\``);
      } catch (e) {
        const error = clean(e);
  
        if (code.includes("--no-embed")) {
          code = code.replace("--no-embed", "");
  
          return msg.channel.send(`\`\`\`js\n${error}\n\`\`\``);
        }
  
        evalEmbed.addField("Error", `\`\`\`js\n${error}\n\`\`\``);
      }
  
      msg.channel.send(evalEmbed);
    }
  };
  
  function clean(text) {
    if (typeof text === "string")
      return text
        .replace(/`/g, `\`${String.fromCharCode(8203)}`)
        .replace(/@/g, `@${String.fromCharCode(8203)}`);
    // eslint-disable-line prefer-template
    else return text;
  }