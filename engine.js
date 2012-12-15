var GameEngine = new function() {
    this.socket = false;
    this.fbinfo = false;
    this.connected = false;
    this.mapdata = false;
    this.mapz = 0;
    
    this._doFBLogin = function() {
        this.parseInput("Facebook not authorized. Asking for permission..");
        FB.login(function(response) {
            if (response.authResponse) {
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
        this.parseInput("<br>Connecting to game server..");
        this.socket = io.connect('http://ethryx.net:2772');
        this._socketEvents();
    }
    
    this._socketEvents = function() {
        /* Built In Events */
        this.socket.on('connect', function(){
            GameEngine.connected = true;
            GameEngine.parseInput("Connected! Sending login data..");
            GameEngine.socket.emit('login', {
                id: GameEngine.fbinfo.id,
                name: GameEngine.fbinfo.name,
                picture: GameEngine.fbinfo.picture
            });
            // Stops player from leaving page if connected.
            $(window).on('beforeunload', function(){
                return 'You are currently connected to the game, and this action will cause you be disconnected.';
            });
            
            $('#inputGameCommands').focus();
        });
        this.socket.on('disconnect', function(){
            GameEngine.connected = false;
            GameEngine.parseInput("The connection has been lost!");
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
            GameEngine.mapPosition(data.x, data.y, data.z);
        });
        this.socket.on('mapnomove', function(){
            GameEngine.parseInput("Alas, you cannot go that way.");
            $('#gameMapCanvas').effect("shake", { times:3 , distance: 1}, 250);
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
                this.socket.emit('cmd', {cmd: command.substr(1)});
            } else if(directions.indexOf(command.toLowerCase()) >= 0) {
                this.socket.emit('cmd', {cmd: 'move ' + command});
            } else {
                if(command)
                    this.socket.emit('cmd', {cmd: 'say ' + command});
            }
        }
        $('#inputGameCommands').val('');
    }
    
    this.mapRender = function(mapdata) {
        if(mapdata === false) {
            mapdata = this.mapdata;
        } else {
            this.mapdata = mapdata;
            this.mapz = 0;
        }
        // draw rooms
        $('#gameMapCanvas').html('');
        var next_type = "type_grass";
        mapdata.forEach(function(maproom){
            var x = parseInt(maproom.x);
            var y = parseInt(maproom.y);
            var z = parseInt(maproom.z);
            if(z != GameEngine.mapz) return true; // skip
            var left = x * 20;
            var top = y * 20;
            // calculate borders
            var border_class = '';
            if(!GameEngine.mapGridAt(x, y - 1)) border_class += 't';
            if(!GameEngine.mapGridAt(x + 1, y)) border_class += 'r';
            if(!GameEngine.mapGridAt(x, y + 1)) border_class += 'b';
            if(!GameEngine.mapGridAt(x - 1, y)) border_class += 'l';
            if(border_class) border_class = ' border' + border_class;
            $('#gameMapCanvas').html($('#gameMapCanvas').html() + "<div class='grid " + next_type + border_class + "' style='top: " + top + "px; left: " + left + "px'></div>");
            
            //if(next_type == 'type_grass') { next_type = 'type_dirt'; } else { next_type = 'type_grass'; }
            if(next_type == 'type_grass') { next_type = 'type_dirt'; } else if (next_type == 'type_dirt') {    next_type = 'type_water'; } else if (next_type == 'type_water') { next_type = 'type_grass'; }
        });
    }
    
    this.mapGridAt = function(x, y) {
        if(!this.mapdata) return;
        for(var i = 0; i < this.mapdata.length; i++) {
            if(this.mapdata[i].x == x && this.mapdata[i].y == y && this.mapdata[i].z == this.mapz) return this.mapdata[i];
        }
        return false;
    }
    
    this.mapPosition = function(x, y, z) {
        if(!this.mapdata) { console.log('GameEngine.mapPosition('+x+','+y+','+z+'): failed - local map cache empty'); return;}
        if(!this.mapGridAt(x, y)) { console.log('GameEngine.mapPosition('+x+','+y+','+z+'): failed - destination doesnt exist in local map cache'); return;}
        if(this.mapz != z) this.mapRender(false);
        $('#gameMapCanvas').animate({left: (80 + (-20 * (x - 1))) + 'px'}, 250);
        $('#gameMapCanvas').animate({top: (80 + (-20 * (y - 1))) + 'px'}, 250);
    }
};