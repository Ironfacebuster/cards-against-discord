const discord = require("discord.js");
const fs = require('fs');
var shuffle = require('shuffle-array');
const MongoClient = require('mongodb').MongoClient;

const prefix = "cad ";

const blackLocation = "CARDS/BLACK_CARDS.json"
const whiteLocation = "CARDS/WHITE_CARDS.json"

const blackCards = JSON.parse(fs.readFileSync(blackLocation, 'utf8'));
const whiteCards = JSON.parse(fs.readFileSync(whiteLocation, 'utf8'));

let translate = require(`./translate.js`);
//translate.run()

const mongoURL = process.env.URL;

const ownerID = "161570878348328960";

var currentRooms = [];

setInterval(async function () {
    clean_up();
}, 5000);

setInterval(async function () {
    logic();
}, 1350);

function loadCards() {
    if (blackCards != null && whiteCards != null)
        console.log("CARDS LOADED SUCCESSFULLY");
    else
        console.log("CARDS NOT LOADED!");
}

var host = "**Host**\r\ncad start - starts the game\r\ncad create [opt. password] - creates a room with an optional password\r\ncad kick [user number] - kicks the user with that number on the scoreboard\r\n"
var czar = "**Czar**\r\ncad submit [card number] - picks the specified card to win the round\r\n"
var nonczar = "**Non-Czar**\r\ncad submit [card number] - submits the specified card to be judged by the czar\r\ncad cards - shows your cards\r\n"
var other = "**Other**\r\ncad join [room code] [optional password] - joins the room with that room code (and password, if there is one)\r\ncad leave - leaves the room you're in\r\ncad scores - shows the scores of all the users in the same room as you\r\ncad reshuffle - reshuffle your hand, giving you new cards\r\ncad help - send the help menu"

// const helpMenu = {
//     "embed": {
//         "title": "Cards Against Discord Help",
//         "description": "Need some other help? Join the [support server.](https://discord.gg/zf9RJP4)",
//         "fields": [{
//                 "name": "DM Only",
//                 "value": `${host + czar + nonczar + other}`
//             },
//             {
//                 "name": "Non-DM",
//                 "value": "cad language [language code] - change your language\r\ncad stats [opt. user mention] - shows the stats of a user\r\ncad credits - sends you the credits"
//             }
//         ]
//     }
// }

const dmHelp = {
    "embed": {
        "title": "Cards Against Discord Help - DM Commands",
        "fields": [{
            "name": "DM Only",
            "value": `${host + czar + nonczar + other}`
        }]
    }
}

const nondmHelp = {
    "embed": {
        "title": "Cards Against Discord Help - Guild Channel Commands",
        "fields": [{
            "name": "Guild Channel Commands",
            "value": "cad language [language code] - change your language\r\ncad stats [opt. user mention] - shows the stats of a user\r\ncad credits - sends you the credits"
        }]
    }
}

const baseHelp = {
    "embed": {
        "title": "Cards Against Discord Help",
        "fields": [{
                "name": "List all DM commands (create/join games, etc.)",
                "value": "cad help dm"
            },
            {
                "name": "List all __NON__-DM commands (stats, language, etc.)",
                "value": "cad help guild"
            }, {
                "name": "Need some other help?",
                "value": "Join the [support server.](https://discord.gg/zf9RJP4)"
            }
        ]
    }
}

const client = new discord.Client();

client.on('ready', () => {
    console.log("BOT READY.");
    //client.user.setActivity("Working on things... DO NOT ATTEMPT TO USE.");
    client.user.setActivity(`${client.users.size} users insult each other | cad help`, {
        url: "https://www.twitch.tv/ironfacebuster",
        type: "WATCHING"
    });

    loadCards();
});

client.on('guildCreate', () => {
    client.user.setActivity(`${client.users.size} users insult each other | cad help`, {
        url: "https://www.twitch.tv/ironfacebuster",
        type: "WATCHING"
    });
});

client.on('message', async message => {
    const mess = message.content.toLowerCase();

    //if(message.channel.type == "dm" && !mess.indexOf(prefix) && !message.author.bot)

    if (mess.indexOf(prefix) == -1 || message.author.bot  || mess.indexOf(prefix) > 0) {
        if (message.channel.type == "dm") {
            room_chat(message.content.trim(), message);
            return;
        } else
            return;
    }

    //console.log(`LOWERCASE: ${mess}`);

    var command = mess.trim().replace(/cad /i, '').split(' ')[0].toLowerCase();

    var args = message.content.trim().replace(/cad /i, '').split(' ').slice(1);

    //console.log(`COMMAND: ${command}`)
    //console.log(`ARGUMENTS: ${args}`)
    check_user(message.author, message);


    if (message.channel.type == "dm") {
        if (message.author.id == ownerID && command == "restart") {
            restart_bot(args[0],message.author);
        } else if (message.author.id == ownerID && command == "listrooms") {
            list_rooms(message.author);
        }

        if (command == "create")
            createRoom(message.author, message, args);
        else if (command == "join")
            join_room(args[0], message.author, message, args[1]);
        else if (command == "leave")
            leave_room(message.author, message);
        // else if (command == "getrooms")
        // message.reply(JSON.stringify(currentRooms));
        else if (command == "cards")
            cards(message.author.id, message);
        else if (command == "start")
            start_room(message.author, message);
        else if (command == "submit")
            submit_card(message.author, message, args);
        else if (command == "scores")
            room_stats(message.author, message);
        else if (command == "reshuffle")
            new_cards(message.author.id, message);
        else if (command == "kick")
            kick_user(args[0], message.author.id, message);
        else if (command == "help")
            help(message.author, message, args, true)
    } else {
        /* if (command == "randomcard") {
             randomCard(args[0], message);
         } else */
        if (command == "stats")
            stats(message);
        else if (command == "credits")
            credits(message);
        else if (command == "help")
            help(message.author, message, args, false)
        else if (command == "language")
            change_language(message.author, args, message)
        else if (command == "create" || command == "join" || command == "cards" || command == "start" || command == "submit" || command == "scores" || command == "reshuffle" || command == "kick")
            does_not_work(message.author)
    }
});

async function does_not_work (author) {
    author.send("sorry, this command only works in DMs!")
}

async function restart_bot(time,author) {
    client.user.setActivity(`Restarting in ${time} minute(s).`);

    const message = `**Attention** Cards Against Discord will be restarting in approximately ${time} minutes.\r\nDo not leave the room, your stats will not be affected by the restart.`;

    var userCount = 0;
    
    for (var i = currentRooms.length - 1; i >= 0; i--) {
        if(currentRooms[i] != undefined) {
            for (var g = 0; g < currentRooms[i].members.length; g++) {
                var _tempuser = client.fetchUser(currentRooms[i].members[g]._id);
                userCount = userCount + 1;
                _tempuser.then(function (_user) {
                    translate.run(message, currentRooms[i].members[g]._id, mongoURL, null, null, true, _user)
                });
                //translate.run(message, currentRooms[i].members[g]._id, mongoURL, null, null, true, _tempuser)
                // _tempuser.then(function (_user) {
                //     translate.run(message,null,)
                //     _user.send(message);
                // });
            }
        }
    }

    author.send(`${time} minute warning sent to ${userCount} users.`)
}

async function list_rooms (author) {
    for(var i = 0; i < currentRooms.length; i++){
        var content = JSON.stringify("`" + currentRooms[i]) + "`";
        author.send(content);
    }
}

async function help(author,_mess,args,isDM) {
    if(!isDM)
        _mess.reply("ok, sending you a command list!");

    if(args.length < 1) author.send(baseHelp)
    else if(args[0] == "dm") author.send(dmHelp)
    else if (args[0] == "guild") author.send(nondmHelp)

    //author.send(helpMenu)
}

function change_language(author, _args, message) {
    const code = ["zh", "en", "hi", "es", "ar", "ms", "ru", "bn", "pt", "fr"]
    const languages = ["中文", "English", "हिन्दी", "español", "جزائري", "Bahasa melayu", "Русский язык", "বাংলা", "português", "français"]

    if(typeof _args[0] == undefined || _args.length < 1 ) {
        var languageList = "";

        for (var i = 0; i < 10; i++) {
            if (i < 9)
                languageList = languageList + languages[i] + ` (${code[i]}), `
            else
                languageList = languageList + languages[i] + ` (${code[i]}).`
        }
        
        const mess = `You didn't provide a language code!\r\nAvailable codes are: ${languageList}`

        translate.run(mess, message.author.id, mongoURL, null, client, false, message);

        return;
    }

    if (!code.includes(_args[0])) {
        var languageList = "";

        for (var i = 0; i < 10; i++) {
            if (i < 9)
                languageList = languageList + languages[i] + ` (${code[i]}), `
            else
                languageList = languageList + languages[i] + ` (${code[i]}).`
        }

        const mess = `${_args[0]} is not a 2 letter language code.\r\nAvailable codes are: ${languageList}`

        translate.run(mess, message.author.id, mongoURL, null, client, false, message);

        return;
    }

    //update_user(author.id,0,0,0,0,0,0,_args[0]);

    update_language(author.id,_args[0],message)

    //say
}

function check_user(author, _message) {
    const c = new MongoClient(mongoURL, {
        useNewUrlParser: true
    });

    const auth = author;
    const _m = _message;

    c.connect(function (err) {
        if (err)
            console.error(err);

        const db = c.db("cad-storage");

        const dbo = db.collection("user-data");

        // "_id": "",
        // "id": "",
        // "wins": 0,
        // "losses": 0,
        // "level": 0,
        // "xp": 0,
        // "games_left": 0

        var query = {
            "id": auth.id
        };

        dbo.findOne(query, async function (err, res) {
            if (err) {
                _m.reply("sorry, an error has occurred.");
                return;
            }

            if (res == null) {
                addUser(auth);
            }
        });
    });
}

/*
async function randomCard(_c, _m) {
    if (_c == "black")
        _m.channel.send("`" + blackCards._cards[Math.floor(Math.random() * blackCards._cards.length)].content + "`");
    else if (_c == "white")
        _m.channel.send(whiteCards._cards[Math.floor(Math.random() * whiteCards._cards.length)].content)
}
*/

async function room_chat(_args, _m) {
    var _roomindex = -1;

    _author = _m.author;

    for (var i = currentRooms.length - 1; i >= 0; i--) {
        var _tempmem = currentRooms[i].members.findIndex(_m => _m._id == _author.id);
        if (_tempmem != -1) {
            _roomindex = i;
        }
    }

    if (_roomindex != -1) {
        var sentence = _args;

        for (var g = 0; g < currentRooms[_roomindex].members.length; g++) {
            if (currentRooms[_roomindex].members[g]._id != _m.author.id) {
                var _tempuser = client.fetchUser(currentRooms[_roomindex].members[g]._id);
                _tempuser.then(function (_user) {
                    _user.send(`**${_m.author.username}**: ${sentence}`);
                });
            }
        }
    }
}

async function stats(_m) {
    /*
    if(_m.author.id == "209063671316480002") {
        _m.reply("sorry, I didn't understand that command. Please try again.");
        return;
    }
    */

    var author = _m.author;

    if (_m.mentions.users.first() && !_m.mentions.users.first().bot)
        author = _m.mentions.users.first();

    const c = new MongoClient(mongoURL, {
        useNewUrlParser: true
    });

    const auth = author;

    c.connect(function (err) {
        if (err)
            console.error(err);

        const db = c.db("cad-storage");

        const dbo = db.collection("user-data");

        // "_id": "",
        // "id": "",
        // "wins": 0,
        // "losses": 0,
        // "level": 0,
        // "xp": 0,
        // "games_left": 0

        var query = {
            "id": auth.id
        };

        dbo.findOne(query, async function (err, res) {
            if (err) {
                _m.reply("sorry, an error has occurred.");
                return;
            }

            if (res == null) {
                translate.run("user not found! Have they said anything to me yet?", _m.author.id, mongoURL, null, client, true, _m.author)
                //_m.reply("user not found! Have they said anything to me yet?");
                //addUser(auth)
                return;
            }

            const wins = res.wins;
            const losses = res.losses;
            const wl = Math.floor((wins / losses) * 100) / 100;
            const left = res.games_left;
            const color = Math.floor(Math.random() * 16777215);
            const exp = res.xp;
            const level = res.level;
            const cash = res.cash;

            var embed = {
                embed: {
                    "color": color,
                    "footer": {
                        "text": "Cards Against Discord | This command is still a work in progress."
                    },
                    "thumbnail": {
                        "url": author.displayAvatarURL.toString()
                    },
                    "author": {
                        "name": `${author.username}'s stats`
                    },
                    "fields": [{
                            "name": "Wins",
                            "value": wins.toString(),
                            "inline": true
                        },
                        {
                            "name": "Losses",
                            "value": losses.toString(),
                            "inline": true
                        },
                        {
                            "name": "W/L Ratio",
                            "value": wl.toString(),
                            "inline": true
                        },
                        {
                            "name": "Cash",
                            "value": `$${cash}`,
                            "inline": true
                        },
                        {
                            "name": "XP",
                            "value": exp.toString(),
                            "inline": true
                        },
                        {
                            "name": "Level",
                            "value": level.toString(),
                            "inline": true
                        },
                        {
                            "name": "Games in progress left",
                            "value": left.toString(),
                            "inline": true
                        }
                    ]
                }
            };

            //translate.run(embed, null, _m.author.id, mongoURL,null,client,false,_m,true)

            _m.channel.send(embed);
        })
    });


}

function addUser(user) {

    const c = new MongoClient(mongoURL, {
        useNewUrlParser: true
    });

    c.connect(function (err) {
        if (err)
            console.error(err);

        var data = create_player_data();
        data.id = user.id;
        data._id = user.id;

        const db = c.db("cad-storage");

        const dbo = db.collection("user-data");

        dbo.insertOne(data, function (err) {
            if (err)
                console.err(err);

        })
    });
}

// {
//     "_id": "",
//     "id": "",
//     "wins": 0,
//     "losses": 0,
//     "level": 0,
//     "xp": 0,
//     "games_left": 0
// }

function update_user(id, wins, losses, level, xp, games_left, cash) {
    const c = new MongoClient(mongoURL, {
        useNewUrlParser: true
    });

    var query = {
        "id": id
    };

    c.connect(function (err) {
        if (err)
            console.error(err);

        const db = c.db("cad-storage");

        const dbo = db.collection("user-data");

        dbo.findOne(query, async function (err, res) {
            if (err) {
                console.log(err)
                return;
            }

            if (res == null) {
                //addUser(auth)
                return;
            }

            var user = res;

            const userMoney = user.cash.toString() == "NaN" ? 0 : Number.parseInt(user.cash);

            const w = Number.parseInt(Number.parseInt(user.wins) + wins)
            const l = Number.parseInt(Number.parseInt(user.losses) + losses)
            const x = Number.parseInt(Number.parseInt(user.xp) + xp)
            const gl = Number.parseInt(Number.parseInt(user.games_left) + games_left)
            const c = Number.parseInt(Number.parseInt(userMoney) + cash)

            dbo.updateOne(query, {
                $set: {
                    wins: w,
                    losses: l,
                    xp: x,
                    games_left: gl,
                    cash: c
                }
            })
        });
    });
}

function update_language(id, language, message) {

    const c = new MongoClient(mongoURL, {
        useNewUrlParser: true
    });

    var query = {
        "id": id
    };

    c.connect(function (err) {
        if (err)
            console.error(err);

        const db = c.db("cad-storage");

        const dbo = db.collection("user-data");

        dbo.findOne(query, async function (err, res) {
            if (err) {
                console.log(err)
                return;
            }

            if (res == null) {
                //addUser(auth)
                return;
            }

            dbo.updateOne(query, {
                $set: {
                    language: language
                }
            })

            translate.run("Your language has been changed.", id, mongoURL, null, client, false, message);
        });
    });
}

function credits(_m) {
    const _em = {
        "embed": {
            "color": 2551,
            "footer": {
                "text": "bottom text"
            },
            "author": {
                "name": "Cards Against Discord Credits"
            },
            "fields": [{
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

function trimSpaces(string) {
    s = string;
    s = s.replace(/(^\s*)|(\s*$)/gi, "");
    s = s.replace(/[ ]{2,}/gi, " ");
    s = s.replace(/\n /, "\n");
    return s;
}

async function join_room(_roomcode, _author, _message, _password) {
    //const _exists = currentRooms.find(_r => );

    var _exists;

    for (var i = 0; i < currentRooms.length; i++) {
        _exists = currentRooms[i].members.find(_m => _m._id == _author.id);

        if (_exists != null) {
            translate.run("You're already in a game.", _message.author.id, mongoURL, null, client, true, _message.author)
            //_message.reply("You're already in a game.");
            return;
        }
    }

    //_message.channel.send("`" + JSON.stringify(currentRooms) + "`");

    if (_exists != null) {
        translate.run("You're already in a game.", _message.author.id, mongoURL, null, client, true, _message.author)
        // _message.reply("You're already in a game.");
    } else {
        const _room = currentRooms.findIndex(r => r.room_code.trim() == _roomcode.toString().trim());

        if (_room != -1) {

            if (currentRooms[_room].password.length > 0) {
                if (_password == currentRooms[_room].password) {
                    var _player = create_player();
                    _player._id = _author.id;
                    for (var _c = 0; _c < 10; _c++) {
                        _player._cards.push(whiteCards._cards[Math.floor(Math.random() * whiteCards._cards.length)]);
                    }
                    currentRooms[_room].members.push(_player);
                    for (var g = 0; g < currentRooms[_room].members.length; g++) {
                        if (currentRooms[_room].members[g]._id != _author.id) {
                            var _tempuser = client.fetchUser(currentRooms[_room].members[g]._id);
                            _tempuser.then(function (_user) {
                                translate.run(`${_author.username} has joined your room.`, _user.id, mongoURL, null, client, true, _user)
                                //_user.send(`${_author.username} has joined your room.`);
                            });
                        }
                    }
                    _message.reply("Room joined.");
                } else {
                    if (_password.length > 0)
                        translate.run("Incorrect password.", _message.author.id, mongoURL, null, client, true, _message.author)
                    //_message.reply("Incorrect password.");
                    else
                        translate.run("This room has a password.", _message.author.id, mongoURL, null, client, true, _message.author)
                    //_message.reply("This room has a password.");
                }
            } else {
                var _player = create_player();
                _player._id = _author.id;
                for (var _c = 0; _c < 10; _c++) {
                    _player._cards.push(whiteCards._cards[Math.floor(Math.random() * whiteCards._cards.length)]);
                }
                currentRooms[_room].members.push(_player);
                for (var g = 0; g < currentRooms[_room].members.length; g++) {
                    if (currentRooms[_room].members[g]._id != _author.id) {
                        var _tempuser = client.fetchUser(currentRooms[_room].members[g]._id);
                        _tempuser.then(function (_user) {
                            translate.run(`${_author.username} has joined your room.`, _user.id, mongoURL, null, client, true, _user)
                            //_user.send(`${_author.username} has joined your room.`);
                        });
                    }
                }
                translate.run("Room joined.", _message.author.id, mongoURL, null, client, true, _message.author)
                //_message.reply("Room joined.");
            }
        } else {
            translate.run("Room not found.", _message.author.id, mongoURL, null, client, true, _message.author)
            // _message.reply("Room not found.");
        }
    }
}

async function new_cards(id, _message) {
    var _mem = -1;
    var _roomindex;

    for (var i = currentRooms.length - 1; i >= 0; i--) {
        var _tempmem = currentRooms[i].members.findIndex(_m => _m._id == id);
        if (_tempmem != -1) {
            _mem = _tempmem;
            //console.log("FOUND USER? " + currentRooms[i].members.findIndex(_m => _m._id == _author.id) + "\r\nSERVER: " + currentRooms[i]);
            _roomindex = i;
        }
    }

    if (_mem != -1) {
        for (var _c = 0; _c < 10; _c++) {
            currentRooms[_roomindex].members[_mem]._cards[_c] = whiteCards._cards[Math.floor(Math.random() * whiteCards._cards.length)]
        }

        translate.run("Your cards have been repicked.", _message.author.id, mongoURL, null, client, true, _message.author)
        //_message.author.send("Your cards have been repicked.");

        cards(id, _message);

    } else {
        translate.run("You're not in a room!", _message.author.id, mongoURL, null, client, true, _message.author)
        //_message.author.send("You're not in a room!");
    }
}

async function cards(id, _message) {
    var _mem = -1;
    var _roomindex;

    for (var i = currentRooms.length - 1; i >= 0; i--) {
        var _tempmem = currentRooms[i].members.findIndex(_m => _m._id == id);
        if (_tempmem != -1) {
            _mem = _tempmem;
            //console.log("FOUND USER? " + currentRooms[i].members.findIndex(_m => _m._id == _author.id) + "\r\nSERVER: " + currentRooms[i]);
            _roomindex = i;
        }
    }

    if (_mem != -1) {
        var card = "";
        for (var _c = 0; _c < currentRooms[_roomindex].members[_mem]._cards.length; _c++) {
            card = card + `${_c+1}. ` + currentRooms[_roomindex].members[_mem]._cards[_c].content + "\r\n";
        }

        temp_user = client.fetchUser(id);

        temp_user.then(function (user) {
            translate.run(card, user.id, mongoURL, null, client, true, user)
            //user.send(card);
        });

        //_message.reply(card);
    } else {
        temp_user = client.fetchUser(id);

        temp_user.then(function (user) {
            translate.run("You're not in a room!", temp_user.id, mongoURL, null, client, true, user)
            //user.send("You're not in a room!");
        });
    }
}

async function leave_room(_author, _message) {

    var _mem = -1;
    var _roomindex;

    for (var i = currentRooms.length - 1; i >= 0; i--) {
        var _tempmem = currentRooms[i].members.findIndex(_m => _m._id == _author.id);
        if (_tempmem != -1) {
            _mem = _tempmem;
            //console.log("FOUND USER? " + currentRooms[i].members.findIndex(_m => _m._id == _author.id) + "\r\nSERVER: " + currentRooms[i]);
            _roomindex = i;
        }
    }

    if (_mem == -1) {
        translate.run("You're not currently in a game.", _message.author.id, mongoURL, null, client, true, _message.author)
        //_message.reply("You're not currently in a game.");
    } else {
        var _temp = currentRooms[_roomindex].members[_mem];
        currentRooms[_roomindex].members[_mem] = currentRooms[_roomindex].members[currentRooms[_roomindex].members.length - 1];
        currentRooms[_roomindex].members[currentRooms[_roomindex].members.length - 1] = _temp;
        currentRooms[_roomindex].members.pop();
        for (var g = 0; g < currentRooms[_roomindex].members.length; g++) {
            if (currentRooms[_roomindex].members[g]._id != _author.id) {
                var _tempuser = client.fetchUser(currentRooms[_roomindex].members[g]._id);
                _tempuser.then(function (_user) {
                    translate.run(`${_author.username} has left your room.`, _author.id, mongoURL, null, client, true, _user)
                    //_user.send(`${_author.username} has left your room.`);
                });
            }
        }
        if (currentRooms[_roomindex].stage >= 0 && currentRooms[_roomindex].stage < 6) {
            translate.run("Room left. But, you left while a game was in progress!", _author.id, mongoURL, null, client, true, _message.author)
            //_message.reply("Room left. But, you left while a game was in progress!");
            update_user(_author.id, 0, 1, 0, 0, 1)
        } else
            translate.run("Room left.", _message.author.id, mongoURL, null, client, true, _message.author)
        //_message.reply("Room left.");
    }
}

function generateRC(_count) {

    //count is proportional to room count
    var gen = [];

    const letters = "abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNPQRSTUVWXYZ"

    for (var i = 0; i < _count; i++) {
        const randLet = letters.charAt(Math.round(Math.random() * (letters.length - 1))).toString();
        gen.push(randLet);
    }

    const code = gen.join('');

    return code.toString();
}

function create_room(_code, _czar, _host, _password) {
    return {
        "room_code": _code,
        "password": _password,
        "members": [],
        "czar": _czar,
        "host": _host,
        //stage == -1 not started
        //stage == 0 show prompt
        //stage == 1 send message to pick white cards
        //stage == 2 players picking white cards
        //stage == 3 send message to czar
        //stage == 4 await czar choice
        //stage == 5 shift czar
        //stage == 6 game over
        "stage": -1,
        "idle": 0,
        "played_cards": [],
        "czar_choice": null,
        "prompt": ""
    };
}

async function clean_up() {

    console.log(`Memory usage: ${Math.round((process.memoryUsage().heapUsed/process.memoryUsage().heapTotal)*100)}% (${process.memoryUsage().heapUsed}/${process.memoryUsage().heapTotal})`)

    console.log(`${currentRooms.length} rooms active.`)

    console.log(`${client.guilds.size} guilds joined.`)

    console.log(`Uptime: ${client.uptime / 1000}s.`)

    var _cleaned = 0;

    if (Array.isArray(currentRooms) || currentRooms.length) {
        for (var _t = currentRooms.length - 1; _t >= 0; _t--) {
            if (currentRooms[_t] != null) {
                if (currentRooms[_t].idle >= 24) {
                    if (_t != currentRooms.length - 1) {
                        [currentRooms[currentRooms.length - 1], currentRooms[_t]] = [currentRooms[_t], currentRooms[currentRooms.length - 1]];
                    }
                    currentRooms.pop();
                    _cleaned = _cleaned + 1;
                }

                //console.log(currentRooms[_t]);

                if (currentRooms[_t]) {
                    if (currentRooms[_t].members && currentRooms[_t].members.length <= 0)
                        currentRooms[_t].idle = currentRooms[_t].idle + 1;
                    else {
                        currentRooms[_t].idle = 0;
                    }
                }
            }
        }

        if (_cleaned != 0)
            console.log(`${_cleaned} empty rooms cleaned.`);
    }
}

async function start_room(_author, _message) {
    var _mem = -1;
    var _roomindex;

    if (currentRooms.length > 0) {
        for (var i = currentRooms.length - 1; i >= 0; i--) {
            var _tempmem = currentRooms[i].members.findIndex(_m => _m._id == _author.id);
            if (_tempmem != -1) {
                _mem = _tempmem;
                _roomindex = i;
            }
        }
    }

    if (_mem == -1) {
        _message.reply("You're not in a room!");
    } else {
        if (currentRooms[_roomindex].host != _author.id.toString()) {
            _message.reply("You're not the host!");
            return;
        }

        //change to 3 dear god please, the 2 is only for testing!!!!!
        if (currentRooms[_roomindex].members.length < 3) {
            _message.reply("You know what they always say, less than 3 is boring, more than 3 is a party!\r\nIn other words, you need at least 3 people to start.");
            return;
        }

        if (currentRooms[_roomindex].stage != -2) {
            _message.reply("The game's already started!")
            return;
        }

        for (var _i = 0; _i < currentRooms[_roomindex].members.length; _i++) {
            var _tempuser = client.fetchUser(currentRooms[_roomindex].members[_i]._id);
            _tempuser.then(function (_user) {
                translate.run(`${_author.username} has started the game!`, _user.id, mongoURL, null, client, true, _user)
                //_user.send(`${_author.username} has started the game!`);
            });
        }

        currentRooms[_roomindex].stage = 0;
    }
}

async function createRoom(_author, _message, args) {
    for (var i = 0; i < currentRooms.length; i++) {
        _exists = currentRooms[i].members.find(_m => _m._id == _author.id);

        if (_exists != null) {
            translate.run("You're already in a game.", _message.author.id, mongoURL, null, client, true, _message.author)
            // _message.reply("You're already in a game.");
            return;
        }
    }

    var _new;

    if (args.length > 0 && args[0].length > 10) {
        translate.run("The password can't be longer than 10 characters.", _message.author.id, mongoURL, null, client, true, _message.author)
        //_message.reply("The password can't be longer than 10 characters.");
        return;
    }

    if (args.length > 0 && args[0].length > 0)
        _new = create_room(generateRC(4), _author.id.toString(), _author.id.toString(), args[0].toString());
    else
        _new = create_room(generateRC(4), _author.id.toString(), _author.id.toString(), "");

    //_new.room_code = generateRC(4);
    //_new.stage = -1;
    //_new.czar = _author.id.toString();
    //_new.host = _author.id.toString();

    //console.log(args);

    //if (args.length > 0 && args[0].length > 0)
    // _new.password = args[0];
    //else
    // _new.password="";
    //add creator to room

    //console.log("558: " + _new.password);

    currentRooms.push(_new);
    translate.run("Room created with code `" + _new.room_code + "`", _message.author.id, mongoURL, null, client, true, _message.author)
    //_message.reply("Room created with code `" + _new.room_code + "`");

    join_room(_new.room_code, _author, _message, args);
}

function create_player() {
    return {
        "_id": "",
        "_cards": [],
        "_points": 0
    };
}

function create_player_data() {
    return {
        "_id": "",
        "id": "",
        "wins": 0,
        "losses": 0,
        "level": 0,
        "xp": 0,
        "games_left": 0,
        "cash": 0,
        "language": "en"
    }
}

function create_submission() {
    return {
        "_submitter": "",
        "_content": ""
    };
}

async function room_stats(_author, _message) {
    var _roomindex = -1;

    for (var i = currentRooms.length - 1; i >= 0; i--) {
        var _tempmem = currentRooms[i].members.findIndex(_m => _m._id == _author.id);
        if (_tempmem != -1) {
            _roomindex = i;
        }
    }

    if (_roomindex == -1) {
        translate.run("You're not currently in a room.", _message.author.id, mongoURL, null, client, true, _message.author)
        // _message.reply("You're not currently in a room.");
    } else {
        var scores = "Scores:";

        for (var _i = 0; _i < currentRooms[_roomindex].members.length; _i++) {

            var member = currentRooms[_roomindex].members[_i];

            var _tempuser = client.fetchUser(member._id);

            const cur_index = _i;

            const room_index = _roomindex;

            _tempuser.then(function (_user) {

                scores = scores + `\r\n(${cur_index+1}) ${_user.username}: ${currentRooms[room_index].members[cur_index]._points}`;

                if (cur_index >= currentRooms[room_index].members.length - 1) {
                    //console.log(`i = ${_i}\r\nlength = ${currentRooms[_roomindex].members.length}\r\n-1=${currentRooms[_roomindex].members.length-1}`);
                    _message.reply(scores);
                }
            });
        }
        //console.log(`SENT SCORES: ${scores}`);
    }
}

async function submit_card(_author, _message, _args) {
    var _mem = -1;
    var _roomindex;

    for (var i = currentRooms.length - 1; i >= 0; i--) {
        var _tempmem = currentRooms[i].members.findIndex(_m => _m._id == _author.id);
        if (_tempmem != -1) {
            _mem = _tempmem;
            _roomindex = i;
        }
    }

    if (_mem == -1) {
        translate.run("You're not currently in a game.", _message.author.id, mongoURL, null, client, true, _message.author)
        // _message.reply("You're not currently in a game.");
    } else {
        //console.log("ARG: " + _args);
        if (_author.id.toString() == currentRooms[_roomindex].czar.toString()) {
            if (currentRooms[_roomindex].stage != 4) {
                translate.run("You have to wait for everyone to submit their cards.", _message.author.id, mongoURL, null, client, true, _message.author)
                //_message.reply("You have to wait for everyone to submit their cards.");
                return;
            }

            if (_args[0] > 0 && _args[0] <= currentRooms[_roomindex].played_cards.length) {
                var czarsubmit = create_submission();

                const index = _args[0] - 1;

                czarsubmit._submitter = currentRooms[_roomindex].played_cards[index]._submitter;
                czarsubmit._content = currentRooms[_roomindex].played_cards[index]._content;

                //_message.reply("Generated submission: \r\n" + JSON.stringify(czarsubmit));

                //console.log(currentRooms[_roomindex].czar_choice);

                currentRooms[_roomindex].czar_choice = czarsubmit;

                translate.run("Your choice has been submitted.", _message.author.id, mongoURL, null, client, true, _message.author)

                //_message.reply("Your choice has been submitted.");

                //_message.reply("Room czar choice: \r\n" + JSON.stringify(currentRooms[_roomindex].czar_choice));
                //console.log(currentRooms[_roomindex].czar_choice);
            } else {
                translate.run("That isn't a card.", _message.author.id, mongoURL, null, client, true, _message.author)
                // _message.reply("That isn't a card.");
            }
        } else if (_author.id.toString() != currentRooms[_roomindex].czar.toString() && currentRooms[_roomindex].stage == 2 || currentRooms[_roomindex].played_cards == null) {
            if (currentRooms[_roomindex].played_cards && currentRooms[_roomindex].played_cards.find(_card => _card._submitter == _author.id.toString())) {
                translate.run("You've already submitted a card.", _message.author.id, mongoURL, null, client, true, _message.author)
                //_message.reply("You've already submitted a card.");
                return;
            }
            if (_args[0] > 0 || _args[0] < currentRooms[_roomindex].members[_mem]._cards.length) {
                const _c = _args[0] - 1;

                var c1 = create_submission();

                c1._submitter = _author.id.toString();
                //console.log(_args[0] - 1)
                //console.log(_mem);
                //c1._content = currentRooms[_roomindex].members[_mem]._cards[index]._content;

                //console.log(currentRooms[_roomindex].members[_mem]);
                //console.log(currentRooms[_roomindex].members[_mem]._cards);

                c1._content = currentRooms[_roomindex].members[_mem]._cards[_c].content;

                currentRooms[_roomindex].played_cards.push(c1);

                //console.log(JSON.stringify(currentRooms[_roomindex].played_cards));
                translate.run("Your card has been submitted.", _message.author.id, mongoURL, null, client, true, _message.author)
                //_message.reply("Your card has been submitted.");

                currentRooms[_roomindex].members[_mem]._cards[_c] = whiteCards._cards[Math.floor(Math.random() * whiteCards._cards.length)];
            } else {
                translate.run("That isn't a card.", _message.author.id, mongoURL, null, client, true, _message.author)
                //_message.reply("That isn't a card.");
            }
        } else if (currentRooms[_roomindex].stage != 2 && _author.id.toString() != currentRooms[_roomindex].czar.toString()) {
            translate.run("It's not your turn to submit a card.", _message.author.id, mongoURL, null, client, true, _message.author)
            //_message.reply("It's not your turn to submit a card.")
        }
    }
}

async function logic() {
    // client.user.setActivity(`${client.users.size} users insult each other | cad help`, {
    //     url: "https://www.twitch.tv/ironfacebuster",
    //     type: "WATCHING"
    // });
    //stage == -2 not started
    //stage == 0 show prompt
    //stage == 1 send message to pick white cards
    //stage == 2 players picking white cards
    //stage == 3 send message to czar
    //stage == 4 await czar choice
    //stage == 5 shift czar
    //stage == 6 game over

    for (var _in = 0; _in < currentRooms.length; _in++) {

        //Check if the czar left

        var czar_left = true;
        var host_left = true;

        for (var _mem = 0; _mem < currentRooms[_in].members.length; _mem++) {
            if (currentRooms[_in].members[_mem]._id == currentRooms[_in].czar)
                czar_left = false;
            if (currentRooms[_in].members[_mem]._id == currentRooms[_in].host)
                host_left = false;
        }

        if (czar_left && currentRooms[_in].members.length > 0) {
            var _tempczarfind = client.fetchUser(currentRooms[_in].members[0]._id);

            var index = _in;

            if (currentRooms[_in].stage >= 0 && !host_left) {
                _tempczarfind.then(function (_newczar) {
                    for (var _i = 0; _i < currentRooms[index].members.length; _i++) {
                        var _tempuser = client.fetchUser(currentRooms[index].members[_i]._id);
                        _tempuser.then(function (_user) {
                            translate.run(`The current Czar has left.\r\nThe new Czar is ${_newczar.username}.`, _user.id, mongoURL, null, client, true, _user)
                            //_user.send(`The current Czar has left.\r\nThe new Czar is ${_newczar.username}.`);
                        });
                    }
                });
            }

            if (currentRooms[_in].stage != 0) {

                currentRooms[_in].czar_choice = null;

                currentRooms[_in].played_cards = [];

                currentRooms[_in].stage = 0;
            }

            if (currentRooms[_in].members.length < 3) {
                currentRooms[_in].czar_choice = null;

                currentRooms[_in].played_cards = [];

                currentRooms[_in].stage = -1;

                for (var _i = 0; _i < currentRooms[_in].members.length; _i++) {
                    var _tempuser = client.fetchUser(currentRooms[_in].members[_i]._id);
                    _tempuser.then(function (_user) {
                        translate.run(`Oops, since there are less than 3 people in this room, you can't continue playing!`, _user.id, mongoURL, null, client, true, _user);
                        //_user.send(`Oops, since there are less than 3 people in this room, you can't continue playing!`);
                    });
                }
            }

            currentRooms[_in].czar = currentRooms[_in].members[0]._id;
        }

        if (host_left && currentRooms[_in].members.length > 0) {
            var new_host = client.fetchUser(currentRooms[_in].members[0]._id);
            new_host.then(function (_host) {
                translate.run("The host has left, that makes YOU the new host!", _host.id, mongoURL, null, client, true, _host);
                //_host.send("The host has left, that makes YOU the new host!");
            });

            currentRooms[_in].host = currentRooms[_in].members[0]._id;
        }

        if (currentRooms[_in].members.length < 3 && currentRooms[_in].stage >= 0) {
            for (var _i = 0; _i < currentRooms[_in].members.length; _i++) {
                var _tempuser = client.fetchUser(currentRooms[_in].members[_i]._id);
                _tempuser.then(function (_user) {
                    translate.run(`Oops, since there are less than 3 people in this room, you can't continue playing!`, _user.id, mongoURL, null, client, true, _user);
                    //_user.send(`Oops, since there are less than 3 people in this room, you can't continue playing!`);
                });
            }

            currentRooms[_in].stage = -1;
        }

        if (currentRooms[_in].stage == -1) {
            var _tempuser = client.fetchUser(currentRooms[_in].host.toString());
            _tempuser.then(function (_user) {
                translate.run(`Oops, since there are less than 3 people in this room, you can't continue playing!`, _user.id, mongoURL, null, client, true, _user);
                //_user.send("Type `cad start` to start the game when everyone's ready.");
            });

            currentRooms[_in].stage = -2;
        }

        if (currentRooms[_in].stage == 0) {
            var blackCard = blackCards._cards[Math.floor(Math.random() * blackCards._cards.length)].content;

            currentRooms[_in].prompt = "`" + blackCard + "`";

            for (var _i = 0; _i < currentRooms[_in].members.length; _i++) {
                var _tempuser = client.fetchUser(currentRooms[_in].members[_i]._id);

                const czar = currentRooms[_in].czar;

                _tempuser.then(function (_user) {
                    if (_user.id != czar) {
                        translate.run(`The prompt is:\r\n` + "`" + blackCard.toString() + "`\r\nHere are your cards:", _user.id, mongoURL, null, client, true, _user);
                        //_user.send(`The prompt is:\r\n` + "`" + blackCard.toString() + "`\r\nHere are your cards:");
                        cards(_user.id);
                    } else
                        translate.run(`The prompt is:\r\n` + "`" + blackCard.toString() + "`", _user.id, mongoURL, null, client, true, _user);
                    //_user.send(`The prompt is:\r\n` + "`" + blackCard.toString() + "`");
                });
            }

            currentRooms[_in].stage = 1;
        } else if (currentRooms[_in].stage == 1) {
            for (var _i = 0; _i < currentRooms[_in].members.length; _i++) {
                var _tempuser = client.fetchUser(currentRooms[_in].members[_i]._id);

                var czar_id = currentRooms[_in].czar;

                var czar_username = "";

                var czar = client.fetchUser(czar_id);

                czar.then(function (_czar) {
                    czar_username = _czar.username;
                });

                if (currentRooms[_in].members[_i]._id != currentRooms[_in].czar.toString()) {
                    _tempuser.then(function (_user) {
                        translate.run(`The Czar is ` + "`" + czar_username + "`" + `\r\nPick your response card!`, _user.id, mongoURL, null, client, true, _user);
                        //_user.send(`The Czar is ` + "`" + czar_username + "`" + `\r\nPick your response card!`);
                    });
                } else {
                    _tempuser.then(function (_user) {
                        translate.run(`You are the Czar, you'll have to wait for everyone to submit their cards.`, _user.id, mongoURL, null, client, true, _user);
                        //_user.send(`You are the Czar, you'll have to wait for everyone to submit their cards.`);
                    });
                }
            }

            currentRooms[_in].stage = 2;
        } else if (currentRooms[_in].stage == 2) {
            if (currentRooms[_in].played_cards.length >= currentRooms[_in].members.length - 1) {
                shuffle(currentRooms[_in].played_cards);
                currentRooms[_in].stage = 3;
            }
        } else if (currentRooms[_in].stage == 3) {
            //come back

            var prompt = currentRooms[_in].prompt;

            var submissions = "Here's the prompt:\r\n" + prompt + "\r\nHere are the responses:\r\n";

            for (var _c = 0; _c < currentRooms[_in].played_cards.length; _c++) {
                //console.log(currentRooms[_in].played_cards[_c]);
                //console.log(currentRooms[_in].played_cards[_c]._content);
                submissions = submissions + `${_c+1}. ` + currentRooms[_in].played_cards[_c]._content + "\r\n";
            }

            for (var _i = 0; _i < currentRooms[_in].members.length; _i++) {
                var _tempuser = client.fetchUser(currentRooms[_in].members[_i]._id);
                _tempuser.then(function (_user) {
                    translate.run(submissions, _user.id, mongoURL, null, client, true, _user);
                    //_user.send(submissions);
                });
            }

            //console.log(currentRooms)

            currentRooms[_in].stage = 4;
        } else if (currentRooms[_in].stage == 4) {
            //console.log(currentRooms)

            var choice = currentRooms[_in].czar_choice;

            var _currentroom = currentRooms[_in];
            //console.log(JSON.stringify(currentRooms[_in].czar_choice));
            if (choice != null) {

                //if (empty(choice) == false) {
                if (empty(choice) == false) {
                    //console.log(currentRooms[_in].czar_choice);
                    var _submitter = client.fetchUser(choice._submitter);

                    _submitter.then(function (_submit) {
                        for (var _i = 0; _i < _currentroom.members.length; _i++) {

                            if (_currentroom.members[_i]._id == _submit.id) {

                                update_user(_currentroom.members[_i]._id, 0, 0, 0, 10, 0, 5)

                                _currentroom.members[_i]._points = _currentroom.members[_i]._points + 1;
                            }

                            var _tempuser = client.fetchUser(_currentroom.members[_i]._id);
                            _tempuser.then(function (_user) {
                                translate.run(`Czar's choice: ` + "`" + choice._content + "`" + `\r\nSent by: ${_submit.username}`, _user.id, mongoURL, null, client, true, _user);
                                //_user.send(`Czar's choice: ` + "`" + choice._content + "`" + `\r\nSent by: ${_submit.username}`);
                            });
                        }
                    })



                    currentRooms[_in].stage = 5;
                }
            }
        } else if (currentRooms[_in].stage == 5) {

            var current_czar_index = 0;

            for (var i = 0; i < currentRooms[_in].members.length; i++) {
                if (currentRooms[_in].members[i]._id == currentRooms[_in].czar)
                    current_czar_index = i;
            }

            var next_czar = current_czar_index + 1;

            if (next_czar > currentRooms[_in].members.length - 1)
                next_czar = 0;

            //console.log(`OLD CZAR: ${current_czar_index}\r\nNEW CZAR: ${next_czar}\r\nMEMBERS: ${currentRooms[_in].members}\r\nSTAGE: ${currentRooms[_in].stage}`);

            currentRooms[_in].czar = currentRooms[_in].members[next_czar]._id;

            currentRooms[_in].czar_choice = null;

            currentRooms[_in].played_cards = [];

            //console.log(`FINAL CZAR: ${currentRooms[_in].czar}`);

            var end = false;

            for (var i = 0; i < currentRooms[_in].members.length; i++) {
                if (currentRooms[_in].members[i]._points >= 10)
                    end = true;
            }

            if (!end)
                currentRooms[_in].stage = 0;
            else
                currentRooms[_in].stage = 6;

        } else if (currentRooms[_in].stage == 6) {
            var winner = -1;

            for (var i = 0; i < currentRooms[_in].members.length; i++) {
                if (currentRooms[_in].members[i]._points >= 10)
                    winner = i;

                currentRooms[_in].members[i]._points = 0;
            }

            var _winner = client.fetchUser(currentRooms[_in].members[winner]._id);

            const _mem = currentRooms[_in].members;

            _winner.then(function (_win) {
                for (var i = 0; i < _mem.length; i++) {
                    var _tempuser = client.fetchUser(_mem[i]._id);
                    _tempuser.then(function (_user) {
                        translate.run(`And the winner is: **${_win.username}**!\r\nThat means the rest of you are **losers**!`, _user.id, mongoURL, null, client, true, _user);
                        //_user.send(`And the winner is: **${_win.username}**!\r\nThat means the rest of you are **losers**!`);
                    });

                    if (i == winner)
                        update_user(_mem[i]._id, 1, 0, 0, 100, 0, 20)
                    else
                        update_user(_mem[i]._id, 0, 1, 0, 5, 0, 5)
                }
            });

            currentRooms[_in].stage = -1;
        }
    }
}

async function kick_user(kick_id, _author, _message) {
    var _roomindex = -1;

    for (var i = currentRooms.length - 1; i >= 0; i--) {
        var _tempmem = currentRooms[i].members.findIndex(_m => _m._id == _author);
        if (_tempmem != -1) {
            //console.log("FOUND USER? " + currentRooms[i].members.findIndex(_m => _m._id == _author.id) + "\r\nSERVER: " + currentRooms[i]);
            _roomindex = i;
        }
    }

    if (kick_id > currentRooms[_roomindex].members.length) {
        translate.run("That isn't a user.", _message.author.id, mongoURL, null, client, true, _message.author)
        //_message.reply("That isn't a user.");
        return;
    } else if (_author != currentRooms[_roomindex].host) {
        translate.run("You're not the host.", _message.author.id, mongoURL, null, client, true, _message.author)
        //_message.reply("You're not the host.");
        return;
    } else if (currentRooms[_roomindex].members[kick_id - 1]._id == currentRooms[_roomindex].host && _author == currentRooms[_roomindex].host) {
        translate.run("You can't kick yourself!", _message.author.id, mongoURL, null, client, true, _message.author)
        //_message.reply("You can't kick yourself!");
        return;
    }

    if (_roomindex == -1) {
        translate.run("You're not in a room right now!", _message.author.id, mongoURL, null, client, true, _message.author)
        //_message.reply("You're not in a room right now!");
    } else {
        var _temp = currentRooms[_roomindex].members[kick_id - 1];
        currentRooms[_roomindex].members[kick_id - 1] = currentRooms[_roomindex].members[currentRooms[_roomindex].members.length - 1];
        currentRooms[_roomindex].members[currentRooms[_roomindex].members.length - 1] = _temp;
        currentRooms[_roomindex].members.pop();
        for (var g = 0; g < currentRooms[_roomindex].members.length; g++) {
            if (currentRooms[_roomindex].members[g]._id != _author.id && currentRooms[_roomindex].members[g]._id != currentRooms[_roomindex].host) {
                var _tempuser = client.fetchUser(currentRooms[_roomindex].members[g]._id);
                _tempuser.then(function (_user) {
                    translate.run("The host has kicked a user.", _user.id, mongoURL, null, client, true, _user)
                    //_user.send("The host has kicked a user.");
                });
            }
        }
        var _tempuser = client.fetchUser(_temp._id);
        _tempuser.then(function (_user) {
            translate.run("Oh boy, you've been kicked. What'd you do this time?", _user.id, mongoURL, null, client, true, _user)
            // _user.send("Oh boy, you've been kicked. What'd you do this time?");
        });

        translate.run("Oh boy, you've been kicked. What'd you do this time?", _message.author.id, mongoURL, null, client, true, _message.author)
        //_message.reply("The user has been kicked.");
    }
}

Object.defineProperty(Object.prototype, 'isEmpty', function () {
    for (var key in this) {
        if (this.hasOwnProperty(key))
            return false;
    }
    return true;
})

function empty(o) {
    for (var key in o) {
        if (o.hasOwnProperty(key))
            return false;
    }
    return true;
}

const DBL = require("dblapi.js");
const dbl = new DBL(process.env.DBL_TOKEN, client);

dbl.on('posted', () => {
    console.log('Server count updated.');
})

client.login(process.env.TOKEN);