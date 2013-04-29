/*
 Armeria Game Engine
 Created by Mike Du Russel & Josh Schmille
 Copyright 2012 - 2013
 Questions? info@playarmeria.com
 */

var GameEngine = new function() {
    this.debug = {datainput: false};
    this.version = false;       // Version
    this.port = 2772;           // Port
    this.socket = false;        // Socket.IO
    this.fbinfo = false;        // Facebook Information Array
    this.fbaccesstoken = false; // Facebook Access Token
    this.connected = false;     // Connected or not (boolean)
    this.connecting = false;    // Connection in process (to block certain functions)
    this.mapdata = false;       // Entire minimap data
    this.mapz = 0;              // Map Z-Coordinate
    this.maproom = false;       // Object within this.mapdata that contains the current room
    this.mapctx = false;        // Minimap Canvas 2D Context
    this.mapcv = false;         // Minimap Canvas
    this.maptileset = false;    // Image
    this.mapts = false;         // Image Properties
    this.mapanim = false;       // Map Animation for setInterval
    this.mapoffsetx = 0;        // Minimap offset - x
    this.mapoffsety = 0;        // Minimap offset - y
    this.mapdestoffsetx = 0;    // Minimap destination offset - x
    this.mapdestoffsety = 0;    // Minimap destination offset - y
    this.server = false;        // Server class
    this.serverOffline = false; // Set to True if Socket.IO is not found (server offline)
    this.sendHistory = [];      // Array of strings that you sent to the server (for up/down history)
    this.sendHistPtr = false;   // Pointer for navigating the history

    this.init = function(port) {
        // set port
        GameEngine.port = port;
        // intro
        GameEngine.parseInput("Welcome to Armeria! <a href='#' onclick='GameEngine.showIntro()'>What is Armeria?</a><br><br>Please <a href='#' onclick='GameEngine.FBLogin()'>Login</a> with Facebook or visit our <a href='http://forum.playarmeria.com'>Community Forums</a>.<br>");
        // bind ENTER to input box
        $('#input').keypress(function(e){
            if(e.which == 13) GameEngine.parseCommand();
        });
        // bind UP/DOWN to input box (for history)
        $('#input').keyup(function(e){
            if(e.which == 38) GameEngine.navigateHistory('back');
            if(e.which == 40) GameEngine.navigateHistory('forward');
        });
        // numpad macros
        $(document).keydown(function(e){
            switch(e.which) {
                case 104:
                    $('#input').val('n');
                    break;
                case 102:
                    $('#input').val('e');
                    break;
                case 98:
                    $('#input').val('s');
                    break;
                case 100:
                    $('#input').val('w');
                    break;
                case 105:
                    $('#input').val('u');
                    break;
                case 99:
                    $('#input').val('d');
                    break;
                default:
                    return;
            }
            GameEngine.parseCommand();
            return false;
        });
        // stops player from leaving page if connected.
        $(window).on('beforeunload', function(){
            if(GameEngine.connected)
                return 'You are currently connected to the game, and this action will cause you to be disconnected.';
        });
        // setup soundmanager2
        soundManager.setup({url: '/libraries/soundmanager2/swf/', ontimeout: function(){ console.log('SoundManager timed out.'); }});
        // grab 2d context for map and load tileset
        GameEngine.mapcv = document.getElementById('map-canvas');
        GameEngine.mapctx = GameEngine.mapcv.getContext('2d');
        GameEngine.mapctx.lineWidth = 3;
        GameEngine.mapctx.lineJoin = 'round';
        GameEngine.mapctx.strokeStyle = '#ffffff';
        GameEngine.maptileset = new Image();
        GameEngine.maptileset.src = "images/tiles/tileset.png";
        GameEngine.setupTileset();
        // setup error reporting
        window.onerror = function(msg, url, linenumber){
            if(msg == 'ReferenceError: io is not defined') {
                GameEngine.serverOffline = true;
                return;
            }
            // let the user know
            GameEngine.parseInput("<span style='color:#ff6d58'><b>Error: </b>" + msg + "<br><b>Location: </b>" + url + " (line " + linenumber + ")</span>");
            // send it to the server
            $.post('error.php', {msg: msg, loc: url, line: linenumber, version: GameEngine.version}, function(){
                GameEngine.parseInput("<span style='color:#ff6d58'>This error has been reported.</span>");
            });
        };
        // bind item tooltips
        $(document).on('mouseenter', '.itemtooltip', this.itemToolTipEnter);
        $(document).on('mouseleave', '.itemtooltip', this.toolTipLeave);
        $(document).on('mousemove', '.itemtooltip', this.toolTipMove);
        // bind room list tooltips
        $(document).on('mouseenter', '.player', this.roomListToolTipEnter);
        $(document).on('mouseleave', '.player', this.toolTipLeave);
        $(document).on('mousemove', '.player', this.toolTipMove);
        // bind inline links
        $(document).on('mouseenter', '.inlineLink', this.inlineLinkToolTipEnter);
        $(document).on('mouseleave', '.inlineLink', this.toolTipLeave);
        $(document).on('mousemove', '.inlineLink', this.toolTipMove);
        // request animation frame
        var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        window.requestAnimationFrame = requestAnimationFrame;
        // focus input box
        $('#input').focus();
    }

    this.setupTileset = function() {
        /* TILE DEFINITIONS */

        GameEngine.mapts = [
            {def: 'grassTL', sx: 0, sy: 0},
            {def: 'grassT', sx: 1, sy: 0},
            {def: 'grassTR', sx: 2, sy: 0},
            {def: 'grassL', sx: 0, sy: 1},
            {def: 'grass', sx: 1, sy: 1},
            {def: 'grassR', sx: 2, sy: 1},
            {def: 'grassBL', sx: 0, sy: 2},
            {def: 'grassB', sx: 1, sy: 2},
            {def: 'grassRB', sx: 2, sy: 2},
            {def: 'grassTBL', sx: 3, sy: 0},
            {def: 'grassTB', sx: 4, sy: 0},
            {def: 'grassTRB', sx: 5, sy: 0},
            {def: 'grassTRBL', sx: 3, sy: 1},
            {def: 'grassTRL', sx: 6, sy: 0},
            {def: 'grassRL', sx: 6, sy: 1},
            {def: 'grassRBL', sx: 6, sy: 2},
            {def: 'flowers', sx: 4, sy: 1},
            {def: 'grassWorn', sx: 5, sy: 1},
            {def: 'grassTall', sx: 3, sy: 2},
            {def: 'dirt', sx: 7, sy: 0},

            {def: 'waterTL', sx: 0, sy: 3},
            {def: 'waterT', sx: 1, sy: 3},
            {def: 'waterTR', sx: 2, sy: 3},
            {def: 'waterL', sx: 0, sy: 4},
            {def: 'water', sx: 1, sy: 4},
            {def: 'waterR', sx: 2, sy: 4},
            {def: 'waterBL', sx: 0, sy: 5},
            {def: 'waterB', sx: 1, sy: 5},
            {def: 'waterRB', sx: 2, sy: 5},
            {def: 'waterTBL', sx: 3, sy: 3},
            {def: 'waterTB', sx: 4, sy: 3},
            {def: 'waterTRB', sx: 5, sy: 3},
            {def: 'waterTRBL', sx: 3, sy: 4},
            {def: 'waterTRL', sx: 6, sy: 3},
            {def: 'waterRL', sx: 6, sy: 4},
            {def: 'waterRBL', sx: 6, sy: 5},

            {def: 'stoneTL', sx: 0, sy: 6},
            {def: 'stoneT', sx: 1, sy: 6},
            {def: 'stoneTR', sx: 2, sy: 6},
            {def: 'stoneL', sx: 0, sy: 7},
            {def: 'stone', sx: 1, sy: 7},
            {def: 'stoneR', sx: 2, sy: 7},
            {def: 'stoneBL', sx: 0, sy: 8},
            {def: 'stoneB', sx: 1, sy: 8},
            {def: 'stoneRB', sx: 2, sy: 8},
            {def: 'stoneTBL', sx: 3, sy: 6},
            {def: 'stoneTB', sx: 4, sy: 6},
            {def: 'stoneTRB', sx: 5, sy: 6},
            {def: 'stoneTRBL', sx: 3, sy: 7},
            {def: 'stoneTRL', sx: 6, sy: 6},
            {def: 'stoneRL', sx: 6, sy: 7},
            {def: 'stoneRBL', sx: 6, sy: 8},

            {def: 'lavaTL', sx: 0, sy: 9},
            {def: 'lavaT', sx: 1, sy: 9},
            {def: 'lavaTR', sx: 2, sy: 9},
            {def: 'lavaL', sx: 0, sy: 10},
            {def: 'lava', sx: 1, sy: 10},
            {def: 'lavaR', sx: 2, sy: 10},
            {def: 'lavaBL', sx: 0, sy: 11},
            {def: 'lavaB', sx: 1, sy: 11},
            {def: 'lavaRB', sx: 2, sy: 11},
            {def: 'lavaTBL', sx: 3, sy: 9},
            {def: 'lavaTB', sx: 4, sy: 9},
            {def: 'lavaTRB', sx: 5, sy: 9},
            {def: 'lavaTRBL', sx: 3, sy: 10},
            {def: 'lavaTRL', sx: 6, sy: 9},
            {def: 'lavaRL', sx: 6, sy: 10},
            {def: 'lavaRBL', sx: 6, sy: 11},
            {def: 'lavaEdge', sx: 4, sy: 10},

            {def: 'grassWallN', sx: 1, sy: 18},
            {def: 'grassWallS', sx: 1, sy: 16},
            {def: 'grassWallE', sx: 0, sy: 17},
            {def: 'grassWallW', sx: 1, sy: 17},
            {def: 'grassWallU', sx: 0, sy: 19},
            {def: 'grassWallD', sx: 0, sy: 19},

            {def: 'wp', sx: 0, sy: 19},
            {def: 'house', sx: 1, sy: 19}
        ];

        // Calculate Real sx and sy
        this.mapts.forEach(function(ts){
            ts.sx *= 30;
            ts.sy *= 30;
        });

    }

    this._doFBLogin = function() {
        this.parseInput("Facebook not authorized. Asking for permission..");
        FB.login(function(response) {
            if (response.authResponse) {
                // save access token
                GameEngine.fbaccesstoken = response.authResponse.accessToken;
                // connected
                GameEngine._getFBInfo(function(){
                    GameEngine.parseInput("Permission granted.");
                    GameEngine.connect();
                });
            } else {
                // cancelled
                GameEngine.parseInput("Permission denied. Can't login.");
                GameEngine.connecting = true;
            }
        });
    }

    this._getFBInfo = function(callback) {
        FB.api('/me', function(resp){
            GameEngine.fbinfo = resp;
            FB.api('/' + GameEngine.fbinfo.id + '?fields=picture', function(resp){
                GameEngine.fbinfo.picture = resp.picture.data.url;
                callback();
            });
        });
    }

    this.FBLogin = function() {
        if(this.connected) {
            GameEngine.parseInput("You're already connected.");
            return false;
        }
        if(this.connecting) {
            return false;
        }
        if(GameEngine.serverOffline) {
            GameEngine.parseInput("The server is offline. Please refresh and try again soon.");
            return false;
        }
        try {
            GameEngine.connecting = true;
            FB.getLoginStatus(function(response) {
                if (response.status === 'connected') {
                    // save access token
                    GameEngine.fbaccesstoken = response.authResponse.accessToken;
                    // authorized
                    GameEngine._getFBInfo(function(){
                        GameEngine.parseInput("Facebook authorized.");
                        GameEngine.connect();
                    });
                } else if (response.status === 'not_authorized') {
                    // not_authorized
                    GameEngine._doFBLogin();
                } else {
                    // not_logged_in
                    GameEngine._doFBLogin();
                }
            });
        }
        catch(err) {
            this.parseInput("Facebook API has not been initiated yet. Please try again in a few seconds.");
            GameEngine.connecting = true;
        }
        return false;
    }

    this.connect = function() {
        if(!this.fbinfo) return;
        this.parseInput("<br>Connecting to game server..");
        try {
            this.socket = io.connect('http://ethryx.net:' + GameEngine.port, {
                'reconnect': true,
                'reconnection delay': 1000,
                'max reconnection attempts': 10
            });
            this._socketEvents();
        } catch (err) {
            this.parseInput('<b>Shucks!</b> The server seems to be offline. Try refreshing in a few moments and re-login.');
            this.connecting = false;
        }
    }

    this._socketEvents = function() {
        /* Built In Events */
        this.socket.on('connect', function(){
            GameEngine.connected = true;
            GameEngine.parseInput("Connected! Sending login data..");
            GameEngine.socket.emit('login', {
                version: GameEngine.version,
                id: GameEngine.fbinfo.id,
                name: GameEngine.fbinfo.name,
                picture: GameEngine.fbinfo.picture,
                token: GameEngine.fbaccesstoken,
                nick: GameEngine.fbinfo.username
            });
        });
        this.socket.on('disconnect', function(){
            GameEngine.connected = false;
            GameEngine.connecting = false;
            GameEngine.parseInput("The connection has been lost!");
        });
        this.socket.on('reconnect_failed', function(){
            GameEngine.parseInput("Failed to reconnect after ten attempts.");
            GameEngine.connecting = false;
        });
        /* Custom Events */
        this.socket.on('txt', function(data){
            GameEngine.parseInput(data.msg, true);
        });
        this.socket.on('plist', function(data){
            // clear current list
            $('#roomlist').html('');
            data.forEach(function(listdata){
                if(listdata.picture === false)
                    $('#roomlist').html("<li class='player' data-id='" + listdata.id + "' data-type='" + listdata.type + "'><p style='padding-left: 15px'>" + listdata.name + "</p></li>" + $('#roomlist').html());
                else
                    $('#roomlist').html("<li class='player' data-id='" + listdata.id + "' data-type='" + listdata.type + "'><img src='" + listdata.picture + "' width='40px' height='40px'><p>" + listdata.name + "</p></li>" + $('#roomlist').html());
            });
        });
        this.socket.on('map', function(data){
            GameEngine.mapRender(data.data);
            $('#mapname-p').html(data.name);
        });
        this.socket.on('maploc', function(data){
            GameEngine.mapPosition(data.x, data.y, data.z, true);
        });
        this.socket.on('maplocnoanim', function(data){
            if(GameEngine.debug.datainput){ console.log('maplocnoanim: '+data); }
            GameEngine.mapPosition(data.x, data.y, data.z, false);
        });
        this.socket.on('mapnomove', function(data){
            if(data!==false) GameEngine.parseInput("Alas, you cannot go that way.");
            $('#gameMapCanvas').effect("shake", { times:3 , distance: 1}, 250);
        });
        this.socket.on('sound', function(data){
            if(!soundManager.play(data.sfx, {volume: data.volume})) {
                // load sound
                soundManager.createSound({id: data.sfx, url: 'sfx/' + data.sfx});
                // now play it
                soundManager.play(data.sfx, {volume: data.volume});
            }
        });
        this.socket.on('notify', function(data){
            $.gritter.add({
                title: data.title,
                text: data.text,
                image: data.image
            });
        });
        this.socket.on('itemtip', function(data){
            $('#itemtooltip-container').html(data.content);
        });
    }

    this.parseLinks = function(text) {
        var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=\(\)~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(urlRegex, function(url) { return '<a class="inlineLink" href="' + url + '" target="_new">' + url + '</a>'; });
    };

    this.parseInput = function(newString, parseLinks){
        $('#game').html($('#game').html() + ((parseLinks)?this.parseLinks(newString):newString) + '<br>');
        $('#game').scrollTop(999999);
    }

    this.newLine = function(count) {
        for(var i = 0; i < count; i++) {
            this.parseInput("");
        }
    }

    this.showIntro = function() {
        GameEngine.parseInput("<span style='font-size:14px;font-weight:bold;'>WHAT IS ARMERIA?</span>");
        GameEngine.parseInput("Armeria is a social multi-user dungeon, otherwise known as a MUD. Players in this world are known by their name in real-life. Armeria is not only a highly interactive game, but also a social environment. You can sit back, talk with others, listen to music in the pubs or go out and kill some monsters, complete quests, craft new items and best of all, make some money!");
        GameEngine.parseInput("<span style='font-size:14px;font-weight:bold;'>WHY DO I WANT MONEY?</span>");
        GameEngine.parseInput("Armeria uses a real-world currency system. You start the game with a loan (to help you get started). You can both spend money in real-life to get gold in-game and sell gold in-game to get money in real-life (with limitations, of course).");
        GameEngine.parseInput("<span style='font-size:14px;font-weight:bold;'>WHAT IF I'VE NEVER PLAYED A 'MUD' BEFORE?</span>");
        GameEngine.parseInput("That's perfectly fine! We designed this game from the ground up to have a small learning curve for newcommers. However, don't let that steer you away. The game can get very in-depth and has complex and rewarding systems that you would expect in any other MUD.");
        GameEngine.newLine(1);
    }

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

    this.parseCommand = function() {
        var command = $('#input').val();

        var directions = new Array('n','s','e','w','u','d');

        // looking?
        if(command=='') command = '/look';

        // echo (if a command)
        if(this.connected && command.toLowerCase().substr(0, 1)=='/')
            this.parseInput("&gt; <span style='color:#666'>" + command + "</span>");

        if(command.substr(0, 1) == '/') {
            if (command.toLowerCase().substr(0, 9) == '/editmode') {
                this.editModeToggle(command.substr(10));
            } else if (command.toLowerCase() == '/clear') {
                $('#game').html('');
                this.parseInput('Window cleared.');
                $('#input').val('');
                $('#input').focus();
                return;
            } else if (command.toLowerCase() == '/version') {
                this.parseInput('Your client is running version <b>' + this.version + '</b>.');
            } else {
                if(this.connected)
                    this.socket.emit('cmd', {cmd: command.substr(1)});
            }
        } else if(directions.indexOf(command.toLowerCase()) >= 0) {
            if(this.connected)
                this.socket.emit('cmd', {cmd: 'move ' + command});
        } else if(this.connected) {
            if(command)
                this.socket.emit('cmd', {cmd: $("#defaultchannel-select").val() + command});       //Default channel
            else
                this.socket.emit('cmd', {cmd: 'look'});
        }

        // set default channel based on user action
        if(this.connected && command.toLowerCase().substr(0, 1)=='/') {
            var sections = command.substr(1).split(' ');
            var cmd = matchcmd(sections[0], new Array('say', 'reply', 'builder', 'gossip'));
            sections.shift();
            var cmd_args = sections.join(' ');

            switch(cmd.toLowerCase()) {
                case 'say':
                    $("#defaultchannel-select").val('say ');
                    $('#defaultchannel-select').css({ 'color': '#fff' });
                    break;
                case 'builder':
                    $("#defaultchannel-select").val('builder ');
                    $('#defaultchannel-select').css({ 'color': '#fc0' });
                    break;
                case 'gossip':
                    $("#defaultchannel-select").val('gossip ');
                    $('#defaultchannel-select').css({ 'color': '#f39' });
                    break;
                case 'reply':
                    $("#defaultchannel-select").val('reply ');
                    $('#defaultchannel-select').css({ 'color': '#f736f1' });
                    break;
            }
        }

        // save in history
        if(command) {
            this.sendHistory.push(command);
            this.sendHistPtr = this.sendHistory.length;
        }

        // clear and focus
        $('#input').val('');
        $('#input').focus();
    }

    this.navigateHistory = function(direction) {
        var ptr = this.sendHistPtr;
        if(ptr === false) return;
        // navigate
        if(direction=='back')
            ptr--;
        else if(direction=='forward')
            ptr++;
        // check bounds
        if(ptr < 0) { ptr = 0; }
        if(ptr > (this.sendHistory.length - 1)) {
            this.sendHistPtr = this.sendHistory.length - 1;
            $('#input').val('');
            return;
        }
        // display
        $('#input').val(this.sendHistory[ptr]);
        document.getElementById('input').selectionStart = this.sendHistory[ptr].length;
        this.sendHistPtr = ptr;
    }

    this.mapRender = function(mapdata, offsetx, offsety) {
        if(mapdata === false) {
            mapdata = this.mapdata;
        } else {
            this.mapdata = mapdata;
            GameEngine.mapRenderLight(GameEngine.maproom);
        }
        if(offsetx===undefined) offsetx = GameEngine.mapoffsetx;
        if(offsety===undefined) offsety = GameEngine.mapoffsety;
        GameEngine.mapoffsetx = offsetx;
        GameEngine.mapoffsety = offsety;
        // clear canvas
        GameEngine.mapctx.clearRect(0, 0, GameEngine.mapcv.width, GameEngine.mapcv.height);
        // draw rooms
        for(var i = 0; i < mapdata.length; i++) {
            var x = parseInt(mapdata[i].x);
            var y = parseInt(mapdata[i].y);
            var z = parseInt(mapdata[i].z);
            if(z != GameEngine.mapz) continue; // skip
            var left = (x * 30) + offsetx;
            var top = (y * 30) + offsety;
            // only render within viewport
            if(left > -30 && left < 255 && top > -30 && top < 255) {
                var layers = mapdata[i].terrain.split(' ');
                for(var j = 0; j < layers.length; j++) {
                    var founddef = false;
                    for(var k = 0; k < GameEngine.mapts.length; k++) {
                        if(GameEngine.mapts[k].def.toLowerCase() == layers[j].toLowerCase()) {
                            founddef = k;
                            break;
                        }
                    }
                    if(founddef === false) founddef = 4; // default to grass
                    GameEngine.mapctx.drawImage(GameEngine.maptileset, GameEngine.mapts[founddef].sx, GameEngine.mapts[founddef].sy, 30, 30, left, top, 30, 30);
                }
            }
        }
    }

    this.mapGridAt = function(x, y, z) {
        if(!this.mapdata) return;
        for(var i = 0; i < this.mapdata.length; i++) {
            if(this.mapdata[i].x == x && this.mapdata[i].y == y && this.mapdata[i].z == z) return this.mapdata[i];
        }
        return false;
    }

    this.mapPosition = function(x, y, z, anim) {
        if(!this.mapdata) { console.log('GameEngine.mapPosition('+x+','+y+','+z+'): failed - local map cache empty'); return;}
        if(!this.mapGridAt(x, y, z)) { console.log('GameEngine.mapPosition('+x+','+y+','+z+'): failed - destination doesnt exist in local map cache'); return;}
        if(this.mapz != z) {
            this.mapz = z; // save current floor level for renderMap
        }
        // calculate offsets
        this.mapdestoffsetx = 105 - (x * 30);
        this.mapdestoffsety = 105 - (y * 30);
        // lighting?
        this.maproom = this.mapGridAt(x, y, z);
        // use animation?
        if(anim && GameEngine.mapanim === false) {
            GameEngine.mapanim = setInterval(function(){
                var done = 0;
                // X
                if(GameEngine.mapoffsetx < GameEngine.mapdestoffsetx)
                    GameEngine.mapRender(false, (GameEngine.mapoffsetx + 1), GameEngine.mapoffsety);
                else if(GameEngine.mapoffsetx > GameEngine.mapdestoffsetx)
                    GameEngine.mapRender(false, (GameEngine.mapoffsetx - 1), GameEngine.mapoffsety);
                else
                    done++;
                // Y
                if(GameEngine.mapoffsety < GameEngine.mapdestoffsety)
                    GameEngine.mapRender(false, GameEngine.mapoffsetx, (GameEngine.mapoffsety + 1));
                else if(GameEngine.mapoffsety > GameEngine.mapdestoffsety)
                    GameEngine.mapRender(false, GameEngine.mapoffsetx, (GameEngine.mapoffsety - 1));
                else
                    done++;
                // Animation complete?
                if (done==2) {
                    clearInterval(GameEngine.mapanim);
                    GameEngine.mapanim = false;
                } else
                    GameEngine.mapRenderLight(GameEngine.maproom);
            }, 1);
        } else {
            GameEngine.mapRender(false, this.mapdestoffsetx, this.mapdestoffsety);
            GameEngine.mapRenderLight(GameEngine.maproom);
        }
    }

    this.mapRenderLight = function(room) {
        if(room.env == 'underground')
            GameEngine.mapLightRadius(0.3, '20,20,1');
    }

    this.mapLightRadius = function(radius, color) {
        GameEngine.mapctx.beginPath();
        var rad = GameEngine.mapctx.createRadialGradient(120, 120, 1, 120, 120, 240);
        rad.addColorStop(0, 'rgba(' + color + ',0)');
        rad.addColorStop(radius, 'rgba(' + color + ',1)');
        GameEngine.mapctx.fillStyle = rad;
        GameEngine.mapctx.arc(120, 120, 240, 0, Math.PI*2, false);
        GameEngine.mapctx.fill();
    };

    this.itemToolTipEnter = function() {
        $('#itemtooltip-container').html('Loading...');
        $('#itemtooltip-container').fadeIn(75);
        if(GameEngine.connected)
            GameEngine.socket.emit('itemtip', { id: $(this).data('id') });
    };

    this.toolTipLeave = function(){
        $('#itemtooltip-container').fadeOut(75);
    };

    this.toolTipMove = function(e){
        $('#itemtooltip-container').offset({ top:e.pageY + 15, left: e.pageX + 15 });
    };

    this.roomListToolTipEnter = function() {
        $('#itemtooltip-container').html('Loading...');
        $('#itemtooltip-container').fadeIn(75);
        if(GameEngine.connected)
            GameEngine.socket.emit('ptip', { id: $(this).data('id'), type: $(this).data('type') });
    };

    this.inlineLinkToolTipEnter = function() {
        var url = $(this).html().toLowerCase();
        if( url.indexOf('.jpg') > 0 || url.indexOf('.jpeg') > 0 || url.indexOf('.png') > 0 || url.indexOf('.gif') > 0 ) {
            $('#itemtooltip-container').fadeIn(75);
            $('#itemtooltip-container').html('<img src="' + $(this).html() + '" style="max-height:300px;max-width:300px">');
        }
    };
};