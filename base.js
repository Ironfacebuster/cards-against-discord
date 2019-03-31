const discord = require("discord.js");
const fs = require('fs');

const prefix = "cad ";

const blackLocation = "CARDS/BLACK_CARDS.json"
const whiteLocation = "CARDS/WHITE_CARDS.json"

const blackCards = JSON.parse(fs.readFileSync(blackLocation, 'utf8'));
const whiteCards = JSON.parse(fs.readFileSync(whiteLocation, 'utf8'));

const defaultUser = {
    "id": "",
    "wins":0,
    "losses":0,
    "level":0,
    "xp":0
}

function loadCards() {
    if(blackCards != null && whiteCards != null)
        console.log("CARDS LOADED SUCCESSFULLY");
    else 
        console.log("CARDS NOT LOADED!");
}

const client = new discord.Client();

client.on('ready', () => {
    console.log("Bot ready.");
    //client.user.setActivity("Working on things... DO NOT ATTEMPT TO USE.");
    client.user.setActivity(`${client.guilds.size} guilds insult each other | cad help`, {url:"https://www.twitch.tv/ironfacebuster", type:"WATCHING"});

    loadCards();
});

client.on('guildCreate', () => {
    client.user.setActivity(`${client.guilds.size} guilds insult each other | cad help`, {url:"https://www.twitch.tv/ironfacebuster", type:"WATCHING"});
})

client.on('message', async message => {
    const mess = message.content.toLowerCase();

    if(mess.indexOf(prefix) || message.author.bot) 
        return;
    
    var command = mess.trim().replace(prefix, '').split(' ')[0];

    var args = mess.trim().replace(prefix, '').split(' ').slice(1);

    if(command == "randomcard") {
        randomCard(args[0], message);
    } else if (command == "stats")
        stats(message);
});

function randomCard (_c, _m) {
    if (_c == "black")
        _m.channel.send ("`" + blackCards._cards[Math.floor(Math.random() * blackCards._cards.length)].content + "`");
    else if (_c == "white")
        _m.channel.send (whiteCards._cards[Math.floor(Math.random() * whiteCards._cards.length)].content)
}

function stats (_m) {
    /*
    if(_m.author.id == "209063671316480002") {
        _m.reply("sorry, I didn't understand that command. Please try again.");
        return;
    }
    */

    var author = _m.author;

    if(_m.mentions.users.first() && !_m.mentions.users.first().bot)
        author = _m.mentions.users.first();

    const wins = Math.round(Math.random()*100);
    const losses = Math.round(Math.random()*100);
    const wl = Math.floor((wins/losses)*100)/100;

    var color = Math.floor(Math.random()*16777215);

    var embed = { embed: {
        "color": color,
        "footer": {
          "text": "Cards Against Discord"
        },
        "thumbnail": {
          "url": author.displayAvatarURL.toString()
        },
        "author": {
          "name": `${author.username}'s stats`
        },
        "fields": [
          {
            "name": "Wins",
            "value": wins.toString(),
            "inline":true
          },
          {
            "name": "Losses",
            "value": losses.toString(),
            "inline":true
          },
          {
            "name": "W/L Ratio",
            "value": wl.toString(),
            "inline":true
          },
          {
            "name": "XP",
            "value":"0/sonnygay"
          }, 
          {
            "name": "Level",
            "value":"1"
          }
        ]
  }};

    _m.channel.send(embed);
}

function trimSpaces(string){
	s = string;
	s = s.replace(/(^\s*)|(\s*$)/gi,"");
	s = s.replace(/[ ]{2,}/gi," ");
	s = s.replace(/\n /,"\n");
	return s;
}

client.login(process.env.TOKEN);