const discord = require("discord.js");
const fs = require('fs');

const prefix = "cad ";

const blackLocation = "CARDS/BLACK_CARDS.json"
const whiteLocation = "CARDS/WHITE_CARDS.json"

const blackCards = JSON.parse(fs.readFileSync(blackLocation, 'utf8'));
const whiteCards = JSON.parse(fs.readFileSync(whiteLocation, 'utf8'));

var currentRooms = [];

setInterval(async function () {
    clean_up ();
}, 5000);

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
});

client.on('message', async message => {
    const mess = message.content.toLowerCase();

    if(mess.indexOf(prefix) || message.author.bot) 
        return;
    
    var command = mess.trim().replace(prefix, '').split(' ')[0];

    var args = message.content.trim().replace(prefix, '').split(' ').slice(1);

    if(message.channel.type == "dm") {
        if (command == "create")
            createRoom(message.author, message);
        else if (command == "join") 
            join_room(args.join(''), message.author, message);
        else if (command == "leave")
            leave_room(message.author, message);
        else if (command == "getrooms") {
            message.reply(JSON.stringify(currentRooms));
        }
    } else {
        if(command == "randomcard") {
            randomCard(args[0], message);
        } else if (command == "stats")
            stats(message);
        else if (command == "credits")
            credits(message);
    }
});

async function randomCard (_c, _m) {
    if (_c == "black")
        _m.channel.send ("`" + blackCards._cards[Math.floor(Math.random() * blackCards._cards.length)].content + "`");
    else if (_c == "white")
        _m.channel.send (whiteCards._cards[Math.floor(Math.random() * whiteCards._cards.length)].content)
}

async function stats (_m) {
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

function credits (_m) {
    const _em = {
        "embed": {
          "color": 2551,
          "footer": {
            "text": "bottom text"
          },
          "author": {
            "name": "Cards Against Discord Credits"
          },
          "fields": [
            {
              "name": "Art/Coding",
              "value": "Yer Good Ol' Loli Grandpappy#8486"
            },
            {
              "name": "Base Cards",
              "value": "Thank you to everyone who worked on the **[CAH Card Spreadsheet](https://docs.google.com/spreadsheets/d/1lsy7lIwBe-DWOi2PALZPf5DgXHx9MEvKfRw1GaWQkzg/edit)**"
            },
            {
              "name": "Original Idea",
              "value": "Thanks to the original creators of **[Cards Against Humanity](https://cardsagainsthumanity.com/)**"
            }
          ]
        }
    }

    _m.author.send(_em);
}

function trimSpaces(string){
	s = string;
	s = s.replace(/(^\s*)|(\s*$)/gi,"");
	s = s.replace(/[ ]{2,}/gi," ");
	s = s.replace(/\n /,"\n");
	return s;
}

async function join_room (_roomcode, _author, _message) {
    //const _exists = currentRooms.find(_r => );

    var _exists;

    for(var i = 0; i < currentRooms.length; i++){
        _exists = currentRooms[i].members.find(_m => _m._id == _author.id);

        if(_exists != null) {
            _message.reply("You're already in a game.");
            return;
        }
    }

    //_message.channel.send("`" + JSON.stringify(currentRooms) + "`");

    if(_exists != null) {
        _message.reply("You're already in a game.");
    } else {
        const _room = currentRooms.findIndex(r => r.room_code.trim() == _roomcode.toString().trim());

        //_message.reply(_room.toString());

        if(_room != -1) {
            var _player = create_player();
            _player._id = _author.id;
            currentRooms[_room].members.push(_player);
            for(var g = 0; g < currentRooms[_room].members.length; g++){
                if(currentRooms[_room].members[g]._id != _author.id) {
                    var _tempuser = client.fetchUser(currentRooms[_room].members[g]._id);
                    _tempuser.then(function(_user) {
                        _user.send(`${_author.username} has joined your room.`);
                    });
                }
            }
            _message.reply("Room joined.");
            //_message.channel.send("`" + JSON.stringify(currentRooms) + "`");
        } else {
            _message.reply("Room not found.");
        }
    }
}

async function leave_room (_author, _message) {

    var _mem;
    var _roomindex;

    for(var i = currentRooms.length - 1; i >= 0; i--){
        _mem = currentRooms[i].members.findIndex(_m => _m._id == _author.id);
        console(_mem)
        _roomindex = i;
    }

    if(_mem == -1) {
        _message.reply("You're not currently in a game.");
    } else {
        var _temp = currentRooms[_roomindex].members[_mem];
        currentRooms[_roomindex].members[_mem] = currentRooms[_roomindex].members[currentRooms[_roomindex].members.length-1];
        currentRooms[_roomindex].members[currentRooms[_roomindex].members.length-1] = _temp;
        currentRooms[_roomindex].members.pop();
        for(var g = 0; g < currentRooms[_roomindex].members.length; g++){
            if(currentRooms[_roomindex].members[g]._id != _author.id) {
                var _tempuser = client.fetchUser(currentRooms[_roomindex].members[g]._id);
                _tempuser.then(function(_user) {
                    _user.send(`${_author.username} has left your room.`);
                });
            }
        }
        _message.reply("Room left.");
    }
}

function generateRC (_count) {

     //count is proportional  to room count
    var gen = [];

    const letters = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNPQRSTUVWXYZ"

    for(var i = 0; i < _count; i++){
        const randLet = letters.charAt(Math.round(Math.random()*(letters.length-1))).toString();
        gen.push(randLet);
    }

    const code = gen.join('');

    return code.toString();
}

function create_room () {
    return {
        "room_code": "",
        "members": [],
        "czar":"",
        //stage == -1 not started
        //stage == 0 players picking white cards
        //stage == 1 czar picking card
        //stage == 2 shift czar
        //stage == 3 game finished
        "stage": -1,
        "idle":0
   };
}

async function clean_up () {
    var _cleaned = 0;

    if(currentRooms.length > 0) {
        for(var _t = currentRooms.length-1; _t >= 0; _t--) {
            //console.log(_t);
            if(currentRooms[_t].idle >= 24) {
                if(_t != currentRooms.length-1) {
                    /*
                    const _cur = currentRooms[_t];
                    //const _next = currentRooms[0];
                    currentRooms[_t] = currentRooms[0];
                    currentRooms[0] = _cur;
                    */
                    [currentRooms[currentRooms.length-1], currentRooms[_t]] = [currentRooms[_t], currentRooms[currentRooms.length-1]];
                    console.log("FIRST " + JSON.stringify(currentRooms[currentRooms.length-1]))
                    console.log("_T " + JSON.stringify(currentRooms[_t]))
                }
                //console.log("FIRST " + JSON.stringify(currentRooms[0]))
                //console.log("_T " + JSON.stringify(currentRooms[_t]))
                currentRooms.pop();
                _cleaned = _cleaned+1;
            }
            if(currentRooms[_t].members.length == 0) {
                //console.log(JSON.stringify(currentRooms[_t]));
                currentRooms[_t].idle = currentRooms[_t].idle + 1;
            } else {
                currentRooms[_t].idle = 0;
            }
        }
    }

    if(_cleaned != 0)
        console.log(`${_cleaned} empty rooms cleaned.`);
}

async function createRoom (_author, _message) {
    for(var i = 0; i < currentRooms.length; i++){
        _exists = currentRooms[i].members.find(_m => _m._id == _author.id);

        if(_exists != null) {
            _message.reply("You're already in a game.");
            return;
        }
    }
    
    var _new = create_room();

    _new.room_code = generateRC(4);
    _new.stage = -1;
    
    //add creator to room

    currentRooms.push(_new);
    _message.reply ("Room created with code `" + _new.room_code + "`");

    join_room(_new.room_code, _author, _message);
}

function create_player () {
    return {
        "_id": "",
        "_cards": [],
        "_points":0
    };
}

client.login(process.env.TOKEN);