var GameEngine = new function() {
    this.socket = false;
    this.fbinfo = false;
    this.connected = false;
    
    this._doFBLogin = function() {
        this.parseInput("Facebook not authorized. Asking for permission.");
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
            callback();
        });    
    }
    
    this.FBLogin = function() {
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
                name: GameEngine.fbinfo.name
            });
        });
        this.socket.on('disconnect', function(){
            GameEngine.connected = false;
            GameEngine.parseInput("The connection has been lost!");
        });
        /* Custom Events */
        this.socket.on('txt', function(data){
            GameEngine.parseInput(data.msg);
        });
    }
    
    this.parseInput = function(newString){
        $('#frameGame').html($('#frameGame').html() + newString + '<br>');
        $('#frameGame').scrollTop($('#frameGame').height());
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
        if(this.connected) this.socket.emit('cmd', {cmd: $('#inputGameCommands').val()});
        $('#inputGameCommands').val('');
    }
};