// require built-ins
var io            = require('socket.io').listen(2772);
// require custom
var Players       = require('./classes/player').Players;
var Player        = require('./classes/player').Player;
var Characters    = require('./classes/character').Characters;
var Logic         = require('./classes/logic').Logic;
var World         = require('./classes/world').World;

// globals
PLAYERS    = new Players();
CHARACTERS = new Characters();
LOGIC      = new Logic();
WORLD      = new World();

// socket.io logging (options: 0 = error, 1 = warn, 2 = info, 3 = debug [default])
io.set('log level', 1);

// server-level logging (options: init, connections, logins)
display_log = new Array('init', 'connections', 'logins');

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
        // already logged in?
        var logged_in = false;
        PLAYERS.eachOnline(function(p){
            if(p.character.id == data.id) {
                player.msg("You're already logged in somewhere else. Disconnecting..");
                p.msg("<span class='bred'>Warning!</span> Someone else attempted to log in to this character.");
                socket.disconnect();
                logged_in = true;
            }
        });
        if(logged_in) return;
        console.log('got a login from ' + data.name + ' (id: ' + data.id + ')');
        player.character = CHARACTERS.getCharacterById(data.id);
        if(!player.character) {
            player.msg("<br>I've never seen you around here before. You must be new!");
            var gamechar = CHARACTERS.create(data.id, data.name);
            player.character = gamechar;
            player.character.picture = data.picture;
            player.character.player = player;
            if(gamechar) {
                player.msg('<br><b>Horray!</b> Your character has been created. You\'re now known to the world as ' + gamechar.htmlname + '.');
                player.character.login();
            } else {
                player.msg('<br><b>Drat!</b> For some reason, your character could not be created. Try again later.');
            }
        } else {
            player.character.picture = data.picture;
            player.character.player = player;
            player.msg("<br>Welcome back to Armeria, " + player.character.htmlname + "!");
            player.character.login();
        }
    });
    
    socket.on('cmd', function(data){
        // get base command
        var sections = data.cmd.split(' ');
        var cmd = sections[0];
        sections.shift();
        var cmd_args = sections.join(' ');
        switch(cmd.toLowerCase()) {
            case 'say':
                LOGIC.say(player, cmd_args);
                break;
            default:
                player.msg('That command is not recognized. Are you trying to <span class="yellow">say something</span>?');
        }
    });
});