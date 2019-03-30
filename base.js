const discord = require("discord.js");

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
    client.user.setActivity(`{client.guilds.size} guilds insult eachother | help`, "WATCHING");
});



client.login(process.env.TOKEN);