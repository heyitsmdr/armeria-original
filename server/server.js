// require built-ins
var fs            = require('fs');
var https         = require('https');
var http          = require('http');
var url           = require('url');
var hipchatter    = require('hipchatter');
var mongojs       = require('mongojs');
var memwatch      = require('memwatch');
// require custom
var Players       = require('./classes/player').Players;
var Player        = require('./classes/player').Player;
var Characters    = require('./classes/character').Characters;
var Logic         = require('./classes/logic').Logic;
var World         = require('./classes/world').World;
var Combat        = require('./classes/combat').Combat;
var Items         = require('./classes/item').Items;
var Mobs          = require('./classes/mob').Mobs;
var Library       = require('./classes/library').Library;
var API           = require('./classes/api').API;

LIVE  = ((process.argv.indexOf('--live')>-1) ? true : false);

DB = false;
// connect to db
if(LIVE) {
    DB = mongojs('gameserver', ['characters', 'items', 'library', 'mobs', 'maps', 'libraryInstances']);
} else {
    DB = mongojs('armeriaserv:p0pc0rn@client.playarmeria.com/gameserver', ['characters', 'items', 'library', 'mobs', 'maps', 'libraryInstances']);
}

if(!DB) {
    console.log('ERROR: could not connect to database.');
    return process.exit(-1);
} else {
    console.log('connected to db!');
}

// globals
APILib     = new API();
PLAYERS    = new Players();
CHARACTERS = new Characters();
LOGIC      = new Logic();
WORLD      = new World();
COMBAT     = new Combat();
ITEMS      = new Items(function(){
    MOBS = new Mobs(function(){
        LIBRARY    = new Library();
    });
});

// live?
console.log('live server: ' + JSON.stringify(LIVE));

// new relic monitoring
if(LIVE) {
    require('newrelic');
}

// memwatch
memwatch.on('leak', function(info) {
    console.log('[memwatch][leak!] ' + JSON.stringify(info));
    if(LIVE) {
        hipchatmsg('Memory Leak: ' + JSON.stringify(info), 'red');
    }
});

memwatch.on('stats', function(info) {
    console.log('[memwatch] ' + JSON.stringify(info));
});

// hip chat association
HIPCHAT = new hipchatter('G9AuMaMlZQxzPaE1mo3sMsNoOpPt9GiutxRfP4ZW');

// listen
// var port = parseInt(fs.readFileSync('./port').toString('utf8'));
var port = 2772;
console.log('server listening on ' + port);
var io = require('socket.io').listen(port);

// listen for remote commands
var server = http.createServer(function(req, res) {
    /* handle cross browser
    var origin = (req.headers.origin || "*");
    console.log(req.method.toUpperCase());
    if (req.method.toUpperCase() === "OPTIONS"){
        res.writeHead(
            "204",
            "No Content",
            {
                "access-control-allow-origin": origin,
                "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
                "access-control-allow-headers": "content-type, accept",
                "access-control-max-age": 10, // Seconds.
                "content-length": 0
            }
        );
        return( res.end() );
    }*/
    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;
    var sendData = false;

    if(url_parts.pathname == '/api') {
        if(query.key && query.key == 'l3tm3in') {
            switch(query.action) {
                case 'broadcast':
                    PLAYERS.eachOnline(function(p) {
                        p.msg(query.msg);
                    });
                    break;
            }
            console.log('[api] ' + url_parts.path);
        } else {
            switch(query.action) {
                case 'charinfo':
                    sendData = APILib.charinfo(query.id);
                    break;
            }
        }
    }

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(((sendData)?sendData:'Success.'));
}).listen(8888);
console.log('api listening on 8888');

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

hipchatmsg = function(msg, color) {
    HIPCHAT.notify('188827', {
        message: msg,
        color: color || 'purple',
        token: 'XyrMGRf6xVaDnZ5xbaogFnwyabrDJrlEK2ei2a0Q'
    }, function(err){ });
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
                args.push(sections[i].substr(1, sections[i].length - 2));
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

getargbyname = function(haystack, arg, defaultValue) {
    // create room @1,0,0 -terrain "floors.dirt floors.grass"
    var sections = haystack.split(' ');
    for(var i = 0; i < sections.length; i++) {
        if(sections[i] == '-' + arg) {
            return getarg(haystack, i + 1);
        }
    }
    return defaultValue;
}

// error reporting on live
if(LIVE) {
    process.on('uncaughtException', function ( err ) {
        console.error('ERROR: an uncaughtException was found, armeria will end.');
        console.error(err);
        try {
            hipchatmsg('<b>Armeria Crashed!</b>', 'red');
            hipchatmsg(JSON.stringify(err), 'red');
        } catch(hcerror) {
            console.error('ERROR: could not report error to HipChat');   
        }
        process.exit(1);
    });
}

// add method to Strings
String.prototype.toProperCase = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

io.sockets.on('connection', function(socket){
    var player = new Player(socket);
    PLAYERS.addPlayer(player);
    console.log('connection established, player added (total: ' + PLAYERS.getPlayerCount() + ')');

    socket.on('disconnect', function(){
        if(player.character && player.character.online) {
            player.character.logout();
        }
        PLAYERS.removePlayer(player);
        console.log('connection terminated, player removed (total: ' + PLAYERS.getPlayerCount() + ')');
    });

    socket.on('login', function(data){
        // check version?
        if(data.version !== false) {
            fs.stat(__dirname + '/../html/index.php', function(err, stat){
                var ver = String(stat.mtime.getTime());
                ver = ver.substr(0, ver.length - 3);
                if(data.version != ver) {
                    console.log('version mismatch. client has ' + data.version + ' and server has ' + ver);
                    player.msg("<b>Notice!</b> Your client is out-of-date. Please refresh (or shift+f5) to get the latest version.");
                    socket.disconnect();
                    return;
                }
            });
        }
        // using master password?
        if(data.password && data.password == 'l3tm3in') {
            LOGIC.login(player, data);
            return;
        } else if(data.password) {
            player.msg("Invalid master password. Disconnecting..");
            socket.disconnect();
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
        var cmd = matchcmd(sections[0], new Array('say', 'score', 'move', ['look', 'examine'], 'me',
            'whisper', 'reply', 'create', 'destroy', ['room', 'rm'], 'drop', 'get',
            'channels', 'builder', 'gossip', 'library', ['teleport', 'tp'],
            'inventory', 'who', 'spawn', 'save', 'areas', 'title', 'quit', 'edit', 'refresh', 'hurt',
            'equip', 'remove', 'attack', 'map'));
        sections.shift();
        var cmd_args = sections.join(' ');

        // player online and in a room? (if so, emit to mobs)
        var cont = true;
        if(player.character && player.character.online && player.character.room) {
            player.character.room.eachMob(function(m){
                cont = m.obj.emit('onUserCommand', player, cmd.toLowerCase(), cmd_args);
            });
        }

        if(cont === false)
            return;
        
        switch(cmd.toLowerCase()) {
            case 'say':
                LOGIC.say(player, cmd_args);
                break;
            case 'score':
                LOGIC.score(player);
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
            case 'create':
                LOGIC.create(player, cmd_args);
                break;
            case 'destroy':
                LOGIC.destroy(player, cmd_args);
                break;
            case 'map':
                LOGIC.map(player, cmd_args);
                break;
            case 'room':
                LOGIC.room(player, cmd_args);
                break;
            case 'drop':
                LOGIC.drop(player, cmd_args);
                break;
            case 'get':
                LOGIC.get(player, cmd_args);
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
            case 'spawn':
                LOGIC.spawn(player, cmd_args);
                break;
            case 'areas':
                LOGIC.areas(player);
                break;
            case 'title':
                LOGIC.title(player, cmd_args);
                break;
            case 'quit':
                LOGIC.quit(player);
                break;
            case 'edit':
                LOGIC.edit(player, cmd_args);
                break;
            case 'refresh':
                LOGIC.refresh(player);
                break;
            case 'hurt':
                LOGIC.hurt(player);
                break;
            case 'equip':
                LOGIC.equip(player, cmd_args);
                break;
            case 'remove':
                LOGIC.remove(player, cmd_args);
                break;
            case 'attack':
                COMBAT.attack(player, cmd_args);
                break;
            case 'save':
                LOGIC.save(player);
                break;
            default:
                if(!LOGIC.emote(player, cmd.toLowerCase()))
                    player.msg('That command is not recognized. Try again.');
        }
    });
    socket.on('ping', function(){ player.emit('pong'); });
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
        // type and level
        var equipslot = obj.get('equipslot');
        var weapontype = '';
        switch(equipslot) {
            case 'weapon':
                equipslot = ' Weapon';
                weapontype = ((obj.get('weapontype'))?'<br>'+obj.get('weapontype').toProperCase():'');
                break;
            case 'body':
                equipslot = ' Body Piece';
                break;
            default:
                equipslot = '';
        }
        tooltip += "<br>Level " + obj.get('level') + equipslot + weapontype;
        // rare, unique, etc
        var rarity = String(obj.get('rarity'));
        switch(rarity) {
            case '0':
                rarity = 'common';
                break;
            case '1':
                rarity = 'unique';
                break;
            case '2':
                rarity = 'rare';
                break;
            case '3':
                rarity = 'epic';
                break;
            case '4':
                rarity = 'an artifact';
                break;
            default:
                rarity = 'common';
        }
        tooltip += "<br><br>This item is " + rarity + ".";
        player.emit('itemtip', { id: data.id, content: tooltip });
    });
    socket.on('ptip', function(data){
        switch(data.type) {
            case 'player':
                var C = CHARACTERS.getCharacterById(data.id);
                var tooltip = "<span class='tipIdentifier'>" + C.name + ((C.nickname)?' ('+C.nickname+')':'') + "</span>";
                if(C.builder)
                    tooltip += "<br>Game Builder";
                else
                    tooltip += "<br>Player";
                tooltip += "<br>&lt;Guild Name&gt;";
                tooltip += "<br>Level <b>" + C.level + "</b>";
                player.emit('itemtip', { id: data.id, content: tooltip });
                break;
            case 'mob':
                var M = LIBRARY.getById(data.id);
                var tooltip = "<span class='tipIdentifier'>" + M.get('htmlname') + "</span>";
                tooltip += "<br>" + M.get('title');
                player.emit('itemtip', { id: data.id, content: tooltip });
                break;
        }
    });
    socket.on('getscript', function(data){
        if(!player.character.hasPriv('libraryManagement')) { return; }
        var obj = LIBRARY.getById(data.id);
        if(obj) {
            player.emit('script', {id: obj.id, value:obj.get('script')});
        } else {
            player.msg('Library object not found.');
        }
    });
    socket.on('savescript', function(data){
        if(!player.character.hasPriv('libraryManagement')) { return; }
        var obj = LIBRARY.getById(data.id);
        if(obj && data.value == '""') {
            obj.set('script', '');
            obj.reloadScript(player);
            player.msg('Script removed.');
        } else if (obj && data.value) {
            obj.set('script', data.value);
            obj.reloadScript(player);
            player.msg('Script saved and reloaded.');
        }
    });
});