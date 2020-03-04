var Discord = require('discord.js');
var fs = require('fs');
var configs;
var stream = fs.createWriteStream("logs.txt", {flags:'a'});

async function main() {
  var op = process.argv.slice(2)[0].toLowerCase();
  console.log("started, doing " + op);
  if (op === "start") {
    var client = new Discord.Client();
    await loadConfigs();
    var config = configs[0];
    var channels = client.channels.cache.array();
    console.log(channels)
    client.on("ready", async function() {
      console.log("Logged in");
      while(1) {
        var channel = await readline();
        var message = await readline();
        channels.find(i => i.client.name === channel).send(message)
          .then(message => console.log(`Sent: ${message.content}`))
          .catch(console.error);
      }
    });
    client.on("message", msg => {
      console.log("<#" + msg.channel.name + "> " +  msg.author.username + "#" + msg.author.discriminator + ": " + msg.content);
      msg._authun = msg.author.username;
      msg._channel = msg.channel.name;
      msg._disc = msg.author.discriminator;
      stream.write(JSON.stringify(msg) + "\n");
    });
    client.login(config.token);
  } else if (op === "init") {
    await new Promise(yey => {
      fs.access(file, fs.constants.F_OK, (err) => {
        if (!err) {
          process.stdout.write("the config file already exists, do you want to override it with the default value? (y/n) ");
          if ((await (readline())) === "y") {
            fs.copyFile("./config_example.json", "./config.json", () => {
              console.log("copy done!");
              yey();
            });
          } else {
            console.log("aborting")
            yey();
          }
        } else {
          fs.copyFile("./config_example.json", "./config.json", () => {
            console.log("copy done!");
            yey();
          });
        } 
      });
    });
    process.exit(0);
  }
}


main();
var readline__callback;
function readline(cb) {
  if (cb === undefined) return new Promise(yey => {
    readline__callback = yey;
  });
  readline__callback = cb;
  return new Promise(yey => yey());
}
var stdin = process.openStdin();
stdin.addListener("data", function (d) {
  if (readline__callback !== undefined) readline__callback(d.toString().trim());
  readline__callback = undefined;
});
stdin.addListener("end", function () {});

function loadConfigs() {
  return new Promise(yey => {
    fs.readFile("./config.json", (err, data) => {
      if (err) {
        console.log("error reading config file, aborting");
        process.exit(0);
      } else {
        configs = JSON.parse(data.toString()).servers;
        yey();
      }
    })
  })
}
