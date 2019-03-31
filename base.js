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
    client.user.setActivity(`${client.guilds.size} guilds insult eachother | cad help`, {url:"https://www.twitch.tv/ironfacebuster", type:"WATCHING"});

    loadCards();
});

client.on('message', async message => {
    const mess = message.content.toLowerCase();

    if(message.author.bot)
        return;

    if(mess.indexOf(prefix)) 
        return;
    
    var command = mess.trim().replace(prefix, '').split(' ')[0];

    var args = mess.trim().replace(prefix, '').split(' ').slice(1);

    /*
    message.channel.send ("COMMAND: " + command);
    message.channel.send ("ARGS:" + args)
    */

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
    const wins = Math.round(Math.random()*100);
    const losses = Math.round(Math.random()*100);
    const wl = Math.floor((wins/losses)*100)/100;

    var embed = { embed: {
        "color": 7557769,
        "footer": {
          "icon_url": client.user.defaultAvatarURL.toString(),
          "text": "Cards Against Discord"
        },
        "thumbnail": {
          "url": _m.author.displayAvatarURL.toString()
        },
        "author": {
          "name": `${_m.author.username}'s stats`
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