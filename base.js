const discord = require("discord.js");

const prefix = "cad ";

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
    client.user.setActivity(`${client.guilds.size} guilds insult eachother | help`, {url:"https://www.twitch.tv/ironfacebuster", type:"WATCHING"});
});

client.on('message', async message => {
    if(message.author.bot)
        return;

    if(message.content.indexOf(prefix)) 
        return;
    
    var command = message.content.toLowerCase().trim().replace(prefix, '').split(' ')[0];

    var args = message.content.toLowerCase().trim().replace(prefix, '').split(' ').slice(1);

    message.channel.send ("COMMAND: " + command);
    message.channel.send("ARGS:" + args)
});

function trimSpaces(string){
	s = string;
	s = s.replace(/(^\s*)|(\s*$)/gi,"");
	s = s.replace(/[ ]{2,}/gi," ");
	s = s.replace(/\n /,"\n");
	return s;
}

client.login(process.env.TOKEN);