var GameEngine = new function() {
    this.version = false;
    this.port = 2772;
    this.socket = false;
    this.fbinfo = false;
    this.fbaccesstoken = false;
    this.connected = false;
    this.mapdata = false;
    this.mapz = 0;
    this.mapctx = false;
    this.maptileset = false; // Image
    this.mapts = false;      // Image Properties
    this.mapanimx = false;
    this.mapanimy = false;
    this.mapoffsetx = 0;
    this.mapoffsety = 0;

    this.init = function(port) {
        // set port
        GameEngine.port = port;
        // intro
        GameEngine.parseInput("Welcome to Armeria! <a href='#' onclick='GameEngine.showIntro()'>What is Armeria?</a><br><br>Please <a href='#' onclick='GameEngine.FBLogin()'>Login</a> with Facebook.<br>");
        // bind ENTER to input box
        $('#inputGameCommands').keypress(function(e){
            if(e.which == 13) GameEngine.parseCommand();
        });
        // numpad macros
        $(document).keydown(function(e){
            switch(e.which) {
                case 104:
                    $('#inputGameCommands').val('n');
                    break;
                case 102:
                    $('#inputGameCommands').val('e');
                    break;
                case 98:
                    $('#inputGameCommands').val('s');
                    break;
                case 100:
                    $('#inputGameCommands').val('w');
                    break;
                case 105:
                    $('#inputGameCommands').val('u');
                    break;
                case 99:
                    $('#inputGameCommands').val('d');
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
        GameEngine.mapctx = document.getElementById('gameMapCanvas').getContext('2d');
        GameEngine.mapctx.lineWidth = 3;
        GameEngine.mapctx.lineJoin = 'round';
        GameEngine.mapctx.strokeStyle = '#ffffff';

        GameEngine.maptileset = new Image();
        GameEngine.maptileset.src = "images/tiles/tileset.png";
        GameEngine.setupTileset();
        // setup error reporting
        window.onerror = function(msg, url, linenumber){
            GameEngine.parseInput("<span style='color:#ff6d58'><b>Error: </b>" + msg + "<br><b>Location: </b>" + url + " (line " + linenumber + ")</span>");
        }
        // focus input box
        $('#inputGameCommands').focus();
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
            {def: 'grassTRBL', sx: 3, sy: 0},
            {def: 'grassTRL', sx: 4, sy: 0},
            {def: 'grassRL', sx: 5, sy: 0},
            {def: 'grassTBL', sx: 3, sy: 1},
            {def: 'grassTB', sx: 4, sy: 1},
            {def: 'grassTRB', sx: 5, sy: 1},
            {def: 'grassRBL', sx: 3, sy: 2},
            {def: 'dirt', sx: 6, sy: 0},
            {def: 'water', sx: 7, sy: 0},
            {def: 'stairsD', sx: 8, sy: 0},
            {def: 'stairsUD', sx: 9, sy: 0}
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
        return false;
    }
    
    this.connect = function() {
        if(!this.fbinfo) return;
        this.parseInput("<br>Connecting to game server..");
        this.socket = io.connect('http://ethryx.net:' + GameEngine.port, {
            'reconnect': true,
            'reconnection delay': 1000,
            'max reconnection attempts': 10
        });
        this._socketEvents();
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
                token: GameEngine.fbaccesstoken
            });
        });
        this.socket.on('disconnect', function(){
            GameEngine.connected = false;
            GameEngine.parseInput("The connection has been lost!");
        });
        this.socket.on('reconnect_failed', function(){
            GameEngine.parseInput("Failed to reconnect after ten attempts.");
        });
        /* Custom Events */
        this.socket.on('txt', function(data){
            GameEngine.parseInput(data.msg);
        });
        this.socket.on('plist', function(data){
            // clear current list
            $('#playerList').html('');
            data.forEach(function(listdata){
                $('#playerList').html("<li class='player'><img src='" + listdata.picture + "' width='40px' height='40px'><p>" + listdata.name + "</p></li>" + $('#playerList').html());
            });
        });
        this.socket.on('map', function(data){
            GameEngine.mapRender(data.data);
            $('#mapName').html(data.name);
        });
        this.socket.on('maploc', function(data){
            GameEngine.mapPosition(data.x, data.y, data.z, true);
        });
        this.socket.on('maplocnoanim', function(data){
            GameEngine.mapPosition(data.x, data.y, data.z, false);
        });
        this.socket.on('mapnomove', function(){
            GameEngine.parseInput("Alas, you cannot go that way.");
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
    }
    
    this.parseInput = function(newString){
        $('#frameGame').html($('#frameGame').html() + newString + '<br>');
        $('#frameGame').scrollTop(999999);
    }
    
    this.newLine = function(count) {
        for(var i = 0; i < count; i++) {
            this.parseInput("");
        }  
    }
    
    this.showIntro = function() {
        GameEngine.parseInput("<b># WHAT IS ARMERIA?</b>");
        GameEngine.parseInput("Armeria is a social multi-user dungeon, otherwise known as a MUD. Players in this world are known by their name in real-life. Armeria is not only a highly interactive game, but also a social environment. You can sit back, talk with others, listen to music in the pubs or go out and kill some monsters, complete quests, craft new items and best of all, make some money!");
        GameEngine.parseInput("<b># WHY DO I WANT MONEY?</b>");
        GameEngine.parseInput("Armeria uses a real-world currency system. You start the game with a loan (to help you get started). You can both spend money in real-life to get gold in-game and sell gold in-game to get money in real-life (with limitations, of course).");
        GameEngine.parseInput("<b># WHAT IF I'VE NEVER PLAYED A 'MUD' BEFORE?</b>");
        GameEngine.parseInput("That's perfectly fine! We designed this game from the ground up to have a small learning curve for newcommers. However, don't let that steer you away. The game can get very in-depth and has complex and rewarding systems that you would expect in any other MUD.");
        GameEngine.newLine(1);
    }
    
    this.parseCommand = function() {
        if(this.connected) {
            var command = $('#inputGameCommands').val();
            var directions = new Array('n','s','e','w','u','d');
            if(command.substr(0, 1) == '/') {
                if (command.substr(0, 9) == '/editmode') {
                    this.editModeToggle(command.substr(10));
                } else {
                    this.socket.emit('cmd', {cmd: command.substr(1)});
                }
            } else if(directions.indexOf(command.toLowerCase()) >= 0) {
                this.socket.emit('cmd', {cmd: 'move ' + command});
            } else {
                if(command)
                    this.socket.emit('cmd', {cmd: 'say ' + command});
                else
                    this.socket.emit('cmd', {cmd: 'look'});
            }
        }
        $('#inputGameCommands').val('');
        $('#inputGameCommands').focus();
    }
    
    this.mapRender = function(mapdata, offsetx, offsety) {
        if(mapdata === false) {
            mapdata = this.mapdata;
        } else {
            this.mapdata = mapdata;
        }
        if(offsetx===undefined) offsetx = GameEngine.mapoffsetx;
        if(offsety===undefined) offsety = GameEngine.mapoffsety;
        GameEngine.mapoffsetx = offsetx;
        GameEngine.mapoffsety = offsety;
        // clear canvas
        var canvas = document.getElementById('gameMapCanvas');
        GameEngine.mapctx.clearRect(0, 0, canvas.width, canvas.height);
        // draw rooms
        mapdata.forEach(function(maproom){
            var x = parseInt(maproom.x);
            var y = parseInt(maproom.y);
            var z = parseInt(maproom.z);
            if(z != GameEngine.mapz) return true; // skip
            var left = (x * 30) + offsetx;
            var top = (y * 30) + offsety;
            // only render within viewport
            if(left > -30 && left < 255 && top > -30 && top < 255) {
                var layers = maproom.terrain.split(' ');
                layers.forEach(function(layer){
                    var founddef = false;
                    for(var x = 0; x < GameEngine.mapts.length; x++) {
                        if(GameEngine.mapts[x].def.toLowerCase() == layer.toLowerCase()) {
                            founddef = x;
                            break;
                        }
                    }
                    if(founddef === false) founddef = 4; // default to grass
                    GameEngine.mapctx.drawImage(GameEngine.maptileset, GameEngine.mapts[founddef].sx, GameEngine.mapts[founddef].sy, 30, 30, left, top, 30, 30);
                });
                /* REMOVED: Borders around map
                 // is there a grid on the left?
                 if(!GameEngine.mapGridAt(x - 1, y)) {
                     // what about up top?
                     if(!GameEngine.mapGridAt(x, y - 1)) {
                         GameEngine.mapctx.beginPath();
                         GameEngine.mapctx.moveTo(left, top + 30);
                         GameEngine.mapctx.lineTo(left, top);
                         GameEngine.mapctx.lineTo(left + 30, top);
                         GameEngine.mapctx.lineJoin = 'round';
                         GameEngine.mapctx.stroke();
                     } else {
                         GameEngine.mapctx.beginPath();
                         GameEngine.mapctx.moveTo(left, top + 30);
                         GameEngine.mapctx.lineTo(left, top);
                         GameEngine.mapctx.stroke();
                     }
                     // what about the bottom?
                     if(GameEngine.mapGridAt(x - 1, y + 1)) {
                         GameEngine.mapctx.beginPath();
                         GameEngine.mapctx.moveTo(left, top);
                         GameEngine.mapctx.lineTo(left, top + 30);
                         GameEngine.mapctx.lineTo(left - 30, top + 30);
                         GameEngine.mapctx.lineJoin = 'round';
                         GameEngine.mapctx.stroke();
                     }
                 } */
            }
        });
    }
    
    this.mapGridAt = function(x, y) {
        if(!this.mapdata) return;
        for(var i = 0; i < this.mapdata.length; i++) {
            if(this.mapdata[i].x == x && this.mapdata[i].y == y && this.mapdata[i].z == this.mapz) return this.mapdata[i];
        }
        return false;
    }
    
    this.mapPosition = function(x, y, z, anim) {
        if(!this.mapdata) { console.log('GameEngine.mapPosition('+x+','+y+','+z+'): failed - local map cache empty'); return;}
        if(!this.mapGridAt(x, y)) { console.log('GameEngine.mapPosition('+x+','+y+','+z+'): failed - destination doesnt exist in local map cache'); return;}
        if(this.mapz != z) {
            this.mapz = z;
        }
        // clear current animations
        clearInterval(GameEngine.mapanimx);
        clearInterval(GameEngine.mapanimy);
        // calculate offsets
        var offsetx = 105 - (x * 30);
        var offsety = 105 - (y * 30);
        // use animation?
        if(anim) {
            GameEngine.mapanimx = setInterval(function(){
                if(GameEngine.mapoffsetx != offsetx) {
                    if(GameEngine.mapoffsetx < offsetx)
                        GameEngine.mapRender(false, (GameEngine.mapoffsetx + 1), GameEngine.mapoffsety);
                    else
                        GameEngine.mapRender(false, (GameEngine.mapoffsetx - 1), GameEngine.mapoffsety);
                } else {
                    clearInterval(GameEngine.mapanimx);
                }
            }, 5);
            GameEngine.mapanimy = setInterval(function(){
                if(GameEngine.mapoffsety != offsety) {
                    if(GameEngine.mapoffsety < offsety)
                        GameEngine.mapRender(false, GameEngine.mapoffsetx, (GameEngine.mapoffsety + 1));
                    else
                        GameEngine.mapRender(false, GameEngine.mapoffsetx, (GameEngine.mapoffsety - 1));
                } else {
                    clearInterval(GameEngine.mapanimy);
                }
            }, 5);
        } else {
            GameEngine.mapRender(false, offsetx, offsety);
        }
    }
    
    this.editModeToggle = function(state) {
        //TODO: Need to check if user is builder or not. Will also hide the edit button from the beginning if they are not.
        switch(state) {
            case 'on':
                $("#act_Attack").attr("onClick","movementButtonClick('/modify room')");
                $("#dir_N").attr("onClick","movementButtonClick('/create room north -move')");
                $("#dir_U").attr("onClick","movementButtonClick('/create room up -move')");
                $("#dir_W").attr("onClick","movementButtonClick('/create room west -move')");
                $("#act_Look").attr("onClick","movementButtonClick('/look')");
                $("#dir_E").attr("onClick","movementButtonClick('/create room east -move')");
                $("#dir_S").attr("onClick","movementButtonClick('/create room south -move')");
                $("#dir_D").attr("onClick","movementButtonClick('/create room down -move')");
                $("#editMode").attr("onClick", "movementButtonClick('/editmode off')");
                $("#editMode").attr("style", "background-color: rgba(0, 120, 0, 0.3);");
                break;
            case 'off':
                $("#act_Attack").attr("onClick","movementButtonClick('/attack')");
                $("#dir_N").attr("onClick","movementButtonClick('n')");
                $("#dir_U").attr("onClick","movementButtonClick('u')");
                $("#dir_W").attr("onClick","movementButtonClick('w')");
                $("#act_Look").attr("onClick","movementButtonClick('/look')");
                $("#dir_E").attr("onClick","movementButtonClick('e')");
                $("#dir_S").attr("onClick","movementButtonClick('s')");
                $("#dir_D").attr("onClick","movementButtonClick('d')");
                $("#editMode").attr("onClick", "movementButtonClick('/editmode on')");
                $("#editMode").attr("style", "background-color: rgba(120, 0, 0, 0.3);");
                break;
        }
    }
};