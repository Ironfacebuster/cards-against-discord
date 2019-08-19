const translate = require('@vitalets/google-translate-api');
const MongoClient = require('mongodb').MongoClient;
// const test = "You're not the host!\r\nYou're not the host!\r\nYou're not the host!\r\nYou're not the host!\r\nYou're not the host!"

// translate(test, {to: 'es'}).then(res => {
//     console.log(res.text);
//     //=> I speak English
//     console.log(res.from.language.iso);
//     //=> nl
//     translate(res.text, {to: 'en'}).then(res => {
//         console.log(res.text);
//         //=> I speak English
//         console.log(res.from.language.iso);
//         //=> nl

//     }).catch(err => {
//         console.error(err);
//     });
// }).catch(err => {
//     console.error(err);
// });

exports.run = (sent_message, _id, mongoURL, mongoClient, discordClient, isDM, mess) => {

    getUser(_id)

    async function getUser(id) {
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

                var user = res;

                var lan

                if (user.language != null)
                    lan = user.language;
                else
                    lan = 'en';

                if (isDM) {
                    dm_sent_message(lan);
                } else {
                    channel_sent_message(lan);
                }
            });
        });
    }

    function dm_sent_message(language_code) {
        if (language_code == 'en') {
            mess.send(sent_message);
        } else {
            translate(sent_message, {
                to: language_code
            }).then(res => {
                //console.log(res.text);

                mess.send(res.text);

            }).catch(err => {
                console.error(err);
            });
        }
    }

    function channel_sent_message() {
        if (language_code == 'en') {
            mess.channel.send(sent_message);
        } else {
            translate(sent_message, {
                to: language_code
            }).then(res => {
                //console.log(res.text);

                mess.channel.send(res.text);

            }).catch(err => {
                console.error(err);
            });
        }
    }
}