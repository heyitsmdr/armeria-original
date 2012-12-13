// require built-ins
var io            = require('socket.io').listen(2772);
// require custom
var PlayerManager = require('./classes/player_manager').PlayerManager;
var Player        = require('./classes/player').Player;
var Characters    = require('./classes/character').Characters;
var Logic         = require('./classes/logic').Logic;

// globals
PLAYERS    = new PlayerManager();
CHARACTERS = new Characters();
LOGIC      = new Logic();

// socket.io logging (options: 0 = error, 1 = warn, 2 = info, 3 = debug [default])
io.set('log level', 1);

// server-level logging (options: init, connections, logins)
display_log = new Array('init', 'connections', 'logins');

server_log = function(t, m) {
    if(display_log.contains(t))
        console.log('[' + t + '] ' + m);
}

io.sockets.on('connection', function(socket){
    var player = new Player(socket);
    PLAYERS.addPlayer(player);
    server_log('connections', 'connection established, player added (total: ' + PLAYERS.getPlayerCount() + ')');
    
    socket.on('disconnect', function(){
        PLAYERS.removePlayer(player);
        server_log('connections', 'connection terminated, player removed (total: ' + PLAYERS.getPlayerCount() + ')');
    });
    
    socket.on('login', function(data){
        server_log('logins', 'got a login from ' + data.name + ' (id: ' + data.id + ')');
        player.character = CHARACTERS.getCharacterById(data.id);
        if(!player.character) {
            player.msg("<br>I've never seen you around here before. You must be new!");
            var gamechar = CHARACTERS.create(data.id, data.name);
            player.character = gamechar;
            if(gamechar) {
                player.msg('<br><b>Horray!</b> Your character has been created. You\'re now known to the world as ' + gamechar.htmlname + '.');
            } else {
                player.msg('<br><b>Drat!</b> For some reason, your character could not be created. Try again later.');
            }
        } else {
            player.msg("<br>Welcome back to Armeria, " + player.character.htmlname + "!");
        }
    });
    
    socket.on('cmd', function(data){
        // get command
        var sections = data.split(' ');
        switch(sections[0].toLowerCase()) {
            case 'say':
                sections = sections.shift(); // for reference, can also do sections.splice(0, 1);
                LOGIC.say(player, sections.join(' '));
                break;
            default:
                player.msg('That command is not recognized. Try again.');
        }
    });
});