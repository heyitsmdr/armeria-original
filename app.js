// require built-ins
var fs            = require('fs');
var https         = require('https');
// require custom
var Players       = require('./classes/player').Players;
var Player        = require('./classes/player').Player;
var Characters    = require('./classes/character').Characters;
var Logic         = require('./classes/logic').Logic;
var World         = require('./classes/world').World;
var Combat        = require('./classes/combat').Combat;
var Items         = require('./classes/item').Items;
var Library       = require('./classes/library').Library;

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
        https.get("https://graph.facebook.com/me?access_token=" + data.token, function(res){
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
        var cmd = matchcmd(sections[0], new Array('say', 'move', ['look', 'examine'], 'me', 'whisper', 'reply', 'attack', 'create', 'destroy', 'modify', 'channels', 'builder', 'gossip', 'cast', 'library'));
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
            default:
                if(!LOGIC.emote(player, cmd.toLowerCase()))
                    player.msg('That command is not recognized. Try again.');
        }
    });
});