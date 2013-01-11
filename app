#!/usr/bin/node
// require built-ins
var fs            = require('fs');
var path          = require('path');
var https         = require('https');
var daemon        = require('daemon');
// require custom
var Players       = require('./classes/player').Players;
var Player        = require('./classes/player').Player;
var Characters    = require('./classes/character').Characters;
var Logic         = require('./classes/logic').Logic;
var World         = require('./classes/world').World;
var Combat        = require('./classes/combat').Combat;
var Items         = require('./classes/item').Items;
var Library       = require('./classes/library').Library;

var arg = process.argv[2] || false;
var pid;

switch(arg) {
    case 'start':
        if (path.existsSync("./server.pid")) {
            console.log('Server already started. Quitting.');
            return process.exit(-1);
        } else {
            pid = daemon.daemonize({ stdout: 'stdout.txt', stderr: 'stderr.txt' }, './server.pid');
            console.log('Daemon started successfully with pid: ' + pid);
            init();
        }
        break;
    case 'stop':
        if (path.existsSync("./server.pid")) {
            daemon.kill('./server.pid', function(){
                console.log('Server stopped.');
                return process.exit(-1);
            });
            return;
        } else {
            console.log('Server is not running. Can\'t stop. Quitting.');
            return process.exit(-1);
        }
        break;
    case 'restart':
        if (path.existsSync("./server.pid")) {
            daemon.kill('./server.pid', function(){
                console.log('Server restarted.');
                pid = daemon.daemonize({ stdout: 'stdout.txt', stderr: 'stderr.txt' }, './server.pid');
                console.log('Daemon started successfully with pid: ' + pid);
                init();
            });
            return;
        } else {
            pid = daemon.daemonize({ stdout: 'stdout.log', stderr: 'stderr.log' }, './server.pid');
            console.log('Daemon started successfully with pid: ' + pid);
            init();
        }
    default:
        console.log('Valid options:');
        console.log('Syntax: ./app [option]')
        console.log('   start   - start the server');
        console.log('   stop    - stop the server');
        console.log('   restart - restart (or start) the server');
}

function init() {
    // globals
    PLAYERS    = new Players();
    CHARACTERS = new Characters();
    LOGIC      = new Logic();
    WORLD      = new World();
    COMBAT     = new Combat();
    ITEMS      = new Items(function(){
    LIBRARY    = new Library();
    });

    // listen
    var port = parseInt(fs.readFileSync('./port').toString('utf8'));
    console.log('server listening on ' + port);
    var io = require('socket.io').listen(port);

    // socket.io logging (options: 0 = error, 1 = warn, 2 = info, 3 = debug [default])
    io.set('log level', 1);

    matchcmd = function(cmd, cmdlist) {
        var cmd_real = cmd;
        for(var i = 0; i < cmdlist.length; i++) {
            if(typeof cmdlist[i] == 'object') {
                for(var j = 0; j < cmdlist[i].length; j++) {
                    if(cmdlist[i][j].length >= cmd.length && cmdlist[i][j].substr(0,cmd.length) == cmd.toLowerCase()) {
                        return cmdlist[i][0];
                    }
                }
            }
            else if(cmdlist[i].length >= cmd.length && cmdlist[i].substr(0,cmd.length) == cmd.toLowerCase()) {
                return cmdlist[i];
            }
        }

        return cmd_real;
    }

    // haystack = input string
    // needle = argument position (starting with 0)
    // continuous = boolean to return remaining args
    getarg = function(haystack, needle, continuous) {
        var sections = haystack.split(' ');
        var args = new Array();
        var temp = '';
        for(var i = 0; i < sections.length; i++) {
            if(temp.length) {
                if(sections[i].substr(sections[i].length - 1, 1) == '"') {
                    // stop recording and add to arguments array
                    temp += sections[i].substr(0, sections[i].length - 1);
                    args.push(temp);
                    temp = '';
                } else {
                    temp += sections[i] + ' ';
                }
            } else if(sections[i].substr(0, 1) == '"') {
                if(sections[i].substr(sections[i].length - 1, 1) == '"')
                    args.push(sections[i].substr(1, sections[i].length - 1));
                else
                    temp += sections[i].substr(1) + ' ';
            } else {
                args.push(sections[i]);
            }
        }
        if((needle + 1) > args.length) { return false; }
        if(!continuous) {
            return args[needle];
        } else {
            return args.splice(needle, (args.length - needle)).join(' ');
        }
    }

    io.sockets.on('connection', function(socket){
        var player = new Player(socket);
        PLAYERS.addPlayer(player);
        console.log('connection established, player added (total: ' + PLAYERS.getPlayerCount() + ')');

        socket.on('disconnect', function(){
            if(player.character) {
                player.character.logout();
            }
            PLAYERS.removePlayer(player);
            console.log('connection terminated, player removed (total: ' + PLAYERS.getPlayerCount() + ')');
        });

        socket.on('login', function(data){
            // check version?
            if(data.version !== false) {
                fs.stat('./index.php', function(err, stat){
                    if(data.version != stat.mtime) {
                        console.log('version mismatch. client has ' + data.version + ' and server has ' + stat.mtime);
                        player.msg("<b>Notice!</b> Your client is out-of-date. Please refresh to get the latest version.");
                        socket.disconnect();
                        return;
                    }
                });
            }
            // check auth
            https.get({host: 'graph.facebook.com', port: 443, path: '/me?access_token=' + data.token}, function(res){
                var fbresp = '';
                res.on('data', function(chunk){
                    fbresp += chunk;
                });
                res.on('end', function(){
                    fbresp = JSON.parse(fbresp);
                    if(fbresp.id !== undefined && fbresp.id == data.id) {
                        // authorized!
                        LOGIC.login(player, data);
                    } else {
                        player.msg("Failed server-side verification. Bye.");
                        socket.disconnect();
                        return;
                    }
                });
            });
        });

        socket.on('cmd', function(data){
            // get base command
            var sections = data.cmd.split(' ');
            var cmd = matchcmd(sections[0], new Array('say', 'move', ['look', 'examine'], 'me',
                'whisper', 'reply', 'attack', 'create', 'destroy', 'modify',
                'channels', 'builder', 'gossip', 'cast', 'library', ['teleport', 'tp'],
                'inventory', 'who'));
            sections.shift();
            var cmd_args = sections.join(' ');

            switch(cmd.toLowerCase()) {
                case 'say':
                    LOGIC.say(player, cmd_args);
                    break;
                case 'move':
                    LOGIC.move(player, cmd_args);
                    break;
                case 'look':
                    LOGIC.look(player);
                    break;
                case 'me':
                    LOGIC.me(player, cmd_args);
                    break;
                case 'whisper':
                    LOGIC.whisper(player, cmd_args);
                    break;
                case 'reply':
                    LOGIC.reply(player, cmd_args);
                    break;
                case 'attack':
                    LOGIC.attack(player, cmd_args);
                    break;
                case 'create':
                    LOGIC.create(player, cmd_args);
                    break;
                case 'destroy':
                    LOGIC.destroy(player, cmd_args);
                    break;
                case 'modify':
                    LOGIC.modify(player, cmd_args);
                    break;
                case 'channels':
                    LOGIC.channels(player);
                    break;
                case 'builder':
                    LOGIC.channel(player, 'builder', cmd_args);
                    break;
                case 'gossip':
                    LOGIC.channel(player, 'gossip', cmd_args);
                    break;
                case 'cast':
                    LOGIC.cast(player, cmd_args);
                    break;
                case 'library':
                    LOGIC.library(player, cmd_args);
                    break;
                case 'teleport':
                    LOGIC.teleport(player, cmd_args);
                    break;
                case 'inventory':
                    LOGIC.inventory(player);
                    break;
                case 'who':
                    LOGIC.who(player);
                    break;
                default:
                    if(!LOGIC.emote(player, cmd.toLowerCase()))
                        player.msg('That command is not recognized. Try again.');
            }
        });
        socket.on('itemtip', function(data){
            var obj = LIBRARY.getById(data.id);
            if(obj===false) {
                player.emit('itemtip', { content: 'Not found in library.' });
                return;
            }
            // name
            var tooltip = "<span class='tipIdentifier'>" + obj.get('htmlname') + "</span>";
            // library id (builders only)
            if(player.character.builder)
                tooltip += "<br><span style='color:#666666'>" + obj.id + "</span>";
            // level
            tooltip += "<br>Level " + obj.get('level');
            // rare, unique, etc
            tooltip += "<br><br>This item is rare.";
            player.emit('itemtip', { content: tooltip });
        });
    });
}