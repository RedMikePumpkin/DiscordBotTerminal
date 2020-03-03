var Discord = require('discord.js');
var fs = require('fs');

async function main() {
  var op = process.argv.slice(2)[0].toLowerCase();
  console.log("started");
  if (op === "start") {
    var client = new Discord.Client();
    var configs = await loadConfigs();
    client.on("ready", () => {
      console.log("Logged in");
    });
    client.on("message", msg => {
      console.log("<" + msg.channel.name + "> " +  msg.author.username + "#" + msg.author.discriminator + ": " + msg.content);
    });
    client.login(configs.token);
  } else if (op === "init") {
    await new Promise(yey => {
      fs.access(file, fs.constants.F_OK, (err) => {
        if (!err) {
          process.stdout.write("the config file already exists, do you want to override it with the default value? (y/n) ");
          if (await readline() === "y") {
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
  
}
