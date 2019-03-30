const discord = require("discord.js");

const prefix = "cad";

const defaultUser = {
    "id": "",
    "wins":0,
    "losses":0,
    "level":0,
    "xp":0
}

const client = new discord.Client();

client.on('ready', () => {
    console.log("Bot ready.");
    //client.user.setActivity("Working on things... DO NOT ATTEMPT TO USE.");
    client.user.seta
    client.user.setActivity(`${client.guilds.size} guilds insult eachother | help`, {url:"https://www.twitch.tv/ironfacebuster", type:"WATCHING"});
});

client.on('message', async message => {
    if(message.author.bot)
        return;

    var t = message.content.toLowerCase().split(prefix.length);

    p = t[0]

    message.channel.send (t[0] + "\r\n" + t[1]);

    if(p == prefix)
      message.reply("haha you're gay).");
});

client.login(process.env.TOKEN);