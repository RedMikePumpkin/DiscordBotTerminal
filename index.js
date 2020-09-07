var Discord = require('discord.js');
var fs = require('fs');
var a_e = require('ansi-escapes');
var winsize = require("window-size");
var moment = require("moment");
var configs;
var stream = fs.createWriteStream("logs.txt", {flags:'a'});
var seenchnls = fs.readFileSync("seenchnls.txt").toString().split("\n");
var listedchnls = fs.readFileSync("listedchnls.txt").toString().split("\n");
var chstream = fs.createWriteStream("seenchnls.txt", {flags:'a'});
var lsstream = fs.createWriteStream("listedchnls.txt", {flags:'a'});
var hcount = parseInt(fs.readFileSync("hc.txt").toString());
var cservers = fs.readFileSync("censoredservers.txt").toString().split('\n');
var bchannels = fs.readFileSync("blockedchannels.txt").toString().split('\n');
cservers.pop()
bchannels.pop()

var premsg = fs.readFileSync("./premsg.txt").toString()

var dospec = 0

var lastc = "0"

var death = require("./death")
var regexs = {}
regexs.spaceb = `(?:^|[ \\-\\t\\n_~\\\`!@#$%^|*()+=\\[\\]\\\\{};:\\'\\",./<>\\?])`
regexs.spacee = `(?:$|[ \\-\\t\\n_~\\\`!@#$%^|*()+=\\[\\]\\\\{};:\\'\\",./<>\\?])`
regexs.space  =   `(?:[ \\-\\t\\n_~\\\`!@#$%^|*()+=\\[\\]\\\\{};:\\'\\",./<>\\?])`
regexs.h      = `${regexs.spaceb}h${regexs.spacee}`
regexs.yes    = `^(?:yes|no|maybe)$`
regexs.die    = `^&die(?: ([0-9]+))?$`
regexs.kill    = `^&kill ([^]+)$`

async function main() {
  var op = process.argv.slice(2)[0].toLowerCase();
  console.log("started, doing " + op);
  if (op === "start") {
    winsize.get();
    if (dospec) process.stdout.write(`${a_e.clearScreen}\x1b[0;${winsize.height - 1}r${"\n".repeat(winsize.height - 1)}${a_e.cursorTo(0, winsize.height - 1)}`)
    var client = new Discord.Client();
    await loadConfigs();
    var config = configs[0];
    client.on("ready", async function() {
      try {
        client.user.setActivity('you', { type: 'WATCHING' })
          .then(presence => writeBeforeLine(`Activity set to ${presence.activities[0].name}`))
          .catch(catchf);
        console.log("Logged in");
        var channels = client.channels.cache.array();
        var members = client.users.cache.array();
        channels.forEach(j => {
          if (listedchnls.find(i => i.startsWith(j.id)) === undefined) {
            listedchnls.push(`${j.id} ${j.guild.name} ${j.name}`);
            lsstream.write(`${j.id} ${j.guild.name} ${j.name}\n`);
          }
        })
        var currentChannel = "0"
        var c
        while(1) {
          if (dospec) process.stdout.write(a_e.eraseLine +  ">")
          var cmd = await readline();
          console.log()
          if (cmd[0] === " ") {
            c = cmd[1];
            cmd = cmd.slice(3);
          }
          if (c === 'c') {
            if (parseInt(cmd)) {
              currentChannel = cmd
            } else {
              var chc = cmd.split(".")
              currentChannel = config.groups.find(i => i.name === chc[0]).channels.find(i => i.name === chc[1]).id
            }
            writeBeforeLine(currentChannel);
          } else if (c === 'l') {
            if (cmd.length === 0) {
              config.groups.forEach(i => writeBeforeLine(i.name));
            } else {
              config.groups.find(i => i.name === cmd).channels.forEach(i => writeBeforeLine(i.name));
            }
          } else if (c === 's') {
            channels.find(i => i.id === currentChannel).send(cmd)
              .catch(catchf);
          } else if (c === 't') {
            if (cmd === '1')
              channels.find(i => i.id === currentChannel).startTyping().catch(catchf);
            else if (cmd === '0')
              channels.find(i => i.id === currentChannel).stopTyping().catch(catchf);
            console.log(cmd);
          } else if (c === 'm') {
            channels.find(i => i.id === currentChannel).send(premsg)
              .catch(catchf);
          }
        }
      } catch (e) {
        if (dospec) console.log(`\x1b[0;${winsize.height}r`);
        console.log(e);
        fs.writeFileSync("hc.txt", hcount.toString() + '\n');
        process.exit();
      }
    })
    var lastMoment = moment();
    var cdtime = 0.5
    lastMoment.add(cdtime, "s");
    var owlastauth = {};
    client.on("message", msg => {
      var censor = cservers.indexOf(msg.guild.id) !== -1
      // if (Math.random() < 0.01) {
      //   msg.channel.send(["yes", "no"][Math.floor(2 * Math.random())]).catch(catchf);
      // }
      writeBeforeLine("<#" + msg.channel.name + " " + msg.channel.id + "> " +  msg.author.username + "#" + msg.author.discriminator + ": " + msg.content);
      writeBeforeLine(JSON.stringify(msg.attachments.array()));
      msg._authun = msg.author.username;
      msg._channel = msg.channel.name;
      msg._disc = msg.author.discriminator;
      if (msg.content.startsWith("&blacklist ") && msg.author !== client.user) {
        lastc = msg.channel
        if (msg.member.roles.cache.find(i => ["Administration", "Administrator"].indexOf(i.name) !== -1)) {
          var argv = msg.content.split(" ");
          argv.shift();
          if (argv[0] === "add") {
            if (bchannels.indexOf(argv[1]) !== -1) {
              msg.channel.send(`it exists`).catch(catchf);
            } else {
              msg.channel.send(`added ${argv[1]} to bl`).catch(catchf);
              bchannels.push(argv[1])
            }
            console.log(bchannels)
            fs.writeFileSync("blockedchannels.txt", bchannels.join("\n") + (bchannels.length > 0 ? "\n" : ""))
          } else if (argv[0] === "remove") {
            if (bchannels.indexOf(argv[1]) !== -1) {
              msg.channel.send(`removed ${argv[1]} from bl`).catch(catchf);
              bchannels.splice(bchannels.indexOf(argv[1]), 1)
            } else {
              msg.channel.send(`it no exists`).catch(catchf);
            }
            console.log(bchannels)
            fs.writeFileSync("blockedchannels.txt", bchannels.join("\n") + (bchannels.length > 0 ? "\n" : ""))
          } else {
            msg.channel.send("you fuck").catch(catchf);
          }
        } else {
          msg.channel.send("why the hell are you using an admin command").catch(catchf);
        }
      }
      if (bchannels.indexOf(msg.channel.id) !== -1) return;
      if (msg.channel.name !== "one-word" && new RegExp(regexs.h, "gi").test(msg.content) && msg.author !== client.user && moment().isAfter(lastMoment)) {
        msg.channel.send('h').catch(catchf);
        lastMoment = moment();
        lastMoment.add(cdtime, "s");
        hcount++;
        lastc = msg.channel
      }
      if (msg.channel.name !== "one-word" && new RegExp(regexs.yes, "gi").test(msg.content) && msg.author !== client.user && moment().isAfter(lastMoment)) {
        if (Math.random() < 0.20) {
          msg.channel.send(["yes", "no", "maybe"][Math.floor(3 * Math.random())]).catch(catchf);
          lastMoment = moment();
          lastMoment.add(cdtime, "s");
          lastc = msg.channel
        }
      }
      if (msg.content.startsWith("&_error ") && moment().isAfter(lastMoment)
        // && config.cmdchnls.indexOf(msg.channel.id) !== -1
      ) {
        var cnt = parseInt(msg.content.slice(7))
        if (!cnt || cnt < 0 || cnt > 999999) {
          msg.channel.send("invalid num")
        } else {
          msg.channel.send("", new Discord.MessageEmbed({
            "title": `error ×${cnt}`,
            "description": "e".repeat(cnt),
            "color": 2105893,
            "footer": {
              "text": "no"
            }
          })).catch(catchf);
        }
        lastMoment = moment();
        lastMoment.add(cdtime, "s");
        lastc = msg.channel
      }
      if (msg.content === "&h" && msg.author !== client.user && moment().isAfter(lastMoment)
        // && config.cmdchnls.indexOf(msg.channel.id) !== -1
      ) {
        msg.channel.send("", new Discord.MessageEmbed({
          "title": "h counter",
          "description": `Encountered ${hcount} h's`,
          "color": 2105893,
          "footer": {
            "text": "very useful information"
          }
        })).catch(catchf);
        lastMoment = moment();
        lastMoment.add(cdtime, "s");
        lastc = msg.channel
      }
      if (new RegExp(regexs.die, "gi").test(msg.content) && msg.author !== client.user && moment().isAfter(lastMoment)
        // && config.cmdchnls.indexOf(msg.channel.id) !== -1
      ) {
        var count = new RegExp(regexs.die, "gi").exec(msg.content)
        if (count !== null) count = parseInt(count[1])
        if (!count) count = 1
        if (msg.author.username !== "RedMikePumpkin") count = 1
        msg.channel.send("", new Discord.MessageEmbed({
          "title": `R.I.P.`,
          "description": new Array(count).fill(0).map(i => `${msg.author.username} ${death[censor ? "c" : "uc"].actions[Math.floor(death[censor ? "c" : "uc"].actions.length * Math.random())]} ${death[censor ? "c" : "uc"].things[Math.floor(death[censor ? "c" : "uc"].things.length * Math.random())]}`).join("\n"),
          "color": 2105893,
          "footer": {
            "text": "good job."
          }
        })).catch(catchf);
        lastMoment = moment();
        lastMoment.add(cdtime, "s");
        lastc = msg.channel
      }
      if (new RegExp(regexs.kill, "gi").test(msg.content) && msg.author !== client.user && moment().isAfter(lastMoment)
        // && config.cmdchnls.indexOf(msg.channel.id) !== -1
      ) {
        var user = new RegExp(regexs.kill, "gi").exec(msg.content)
        if (user !== null) user = user[1]
        if (!user) {
          msg.channel.send("invalid user")
        } else if (user === "<@!684201314447523855>" || user === "<@684201314447523855>"){
          msg.channel.send("", new Discord.MessageEmbed({
            "title": `no`,
            "description": `u`,
            "color": 2105893,
            "footer": {
              "text": "good job."
            }
          })).catch(catchf);
        } else {
          msg.channel.send("", new Discord.MessageEmbed({
            "title": `R.I.P.`,
            "description": `${user} ${death[censor ? "c" : "uc"].actions[Math.floor(death[censor ? "c" : "uc"].actions.length * Math.random())]} ${death[censor ? "c" : "uc"].things[Math.floor(death[censor ? "c" : "uc"].things.length * Math.random())]}`,
            "color": 2105893,
            "footer": {
              "text": "good job."
            }
          })).catch(catchf);
        }
        lastMoment = moment();
        lastMoment.add(cdtime, "s");
        lastc = msg.channel
      }
      if (msg.content === "&help" && msg.author !== client.user && moment().isAfter(lastMoment)
        // && config.cmdchnls.indexOf(msg.channel.id) !== -1
      ) {
        msg.channel.send("", new Discord.MessageEmbed({
          "title": "Help™",
          "description": "here is a list of commands",
          "color": 2105893,
          "fields": [
            {
              "name": "**COMMANDS**",
              "value": "`&die` die like you've always wanted to\n" +
                "`&kill @Person` &die someone else\n" +
                "`&h` list number of h's encountered\n" +
                "`&help` this™\n" +
                "`&knuckles` no\n" +
                "`&error [number]` crash-handle test\n"
            },
            {
              "name": "**ADMIN COMMANDS**",
              "value": "`&blacklist (add/remove) (channel id)` add / remove channel to blacklist\n"
            },
            {
              "name": "**NON-COMMAND COMMANDS**",
              "value": "`yes`, `no`, or `maybe` might respond with a yes, no, or maybe\n" +
                "`h` responds with h"
            }
          ],
          "footer": {
            "text": "(this last one can be anywhere in the message)"
          }
        })).catch(catchf);
        lastMoment = moment();
        lastMoment.add(cdtime, "s");
        lastc = msg.channel
      }
      if (msg.content === "&knuckles" && msg.author !== client.user && moment().isAfter(lastMoment)
        // && config.cmdchnls.indexOf(msg.channel.id) !== -1
      ) {
        msg.channel.send("no").catch(catchf);
        lastMoment = moment();
        lastMoment.add(cdtime, "s");
        lastc = msg.channel
      }
      //channelArray.add(msg.channel)
      //stream.write(JSON.stringify(msg) + "\n");
      if (seenchnls.find(i => i.startsWith(msg.channel.id)) === undefined) {
        seenchnls.push(`${msg.channel.id} ${msg.guild.name} ${msg.channel.name}`);
        chstream.write(`${msg.channel.id} ${msg.guild.name} ${msg.channel.name}\n`);
      }
      if (msg.channel.name === "one-word") {
        // do one word
        if (msg.author.username+msg.author.discriminator !== owlastauth[msg.guild.name] && msg.content.split(" ").length === 1 && !msg.content.attachments) {
          owlastauth[msg.guild.name] = msg.author.username+msg.author.discriminator;
        } else {
          msg.delete().catch(catchf);
        }
      }
    });
    client.login(config.token).catch(catchf);
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
    fs.writeFileSync("hc.txt", hcount.toString() + '\n');
    process.exit(0);
  }
}


main()
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
  if (readline__callback !== undefined) readline__callback(d.toString().slice(0, -2));
  readline__callback = undefined;
});
process.on("SIGINT", function () {
  if (dospec) console.log(`\x1b[0;${winsize.height}r`)
  fs.writeFileSync("hc.txt", hcount.toString() + '\n');
  process.exit();
});

function loadConfigs() {
  return new Promise(yey => {
    fs.readFile("./config.json", (err, data) => {
      if (err) {
        console.log("error reading config file, aborting");
        fs.writeFileSync("hc.txt", hcount.toString() + '\n');
        process.exit(0);
      } else {
        configs = JSON.parse(data.toString()).servers;
        configs._ftable = {}
        
        yey();
      }
    })
  })
}

function writeBeforeLine(msg) {
  winsize.get();
  if (dospec) process.stdout.write(`${a_e.cursorSavePosition}${a_e.cursorTo(0, winsize.height - 2)}${a_e.scrollUp}${msg}${a_e.cursorRestorePosition}`);
  else process.stdout.write(msg + "\n")
}

function catchf(e) {
  if (lastc) lastc.send("", new Discord.MessageEmbed({
    "title": "Error",
    "description": "Error Log",
    "color": 2105893,
    "fields": e.stack.match(/[^]{1,1000}/g).map((i, j) => {return {"name": j.toString(), "value": i}})
  }))
  console.warn(e)
}
