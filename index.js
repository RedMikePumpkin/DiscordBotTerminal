var Discord = require('discord.js');

async function main() {
  var client = new Discord.Client();
  process.stdout.write("enter bot token: ");
  var token = await readline();
  client.on("ready", () => {
    console.log("Logged in");
  });
  client.on("message", msg => {
    console.log(msg.author.username + "#" + msg.author.discriminator + ": " + msg.content)
  })
  client.login(token);
}


main();
var readline__callback;
function readline(cb) {
  if (cb !== undefined) readline__callback = cb;
  else return new Promise(yey => {
    readline__callback = yey;
  });
  return null;
}
var stdin = process.openStdin();
stdin.addListener("data", function (d) {
  if (readline__callback !== undefined) readline__callback(d.toString().trim());
  readline__callback = undefined;
});
stdin.addListener("end", function () {});
