/*
 Armeria Game Engine
 Created by Mike Du Russel & Josh Schmille
 Copyright 2012 - 2013
 Questions? info@playarmeria.com
 */
/*jslint browser: true, plusplus: true, continue: true*/
/*global console: false, prompt: false, $: false, soundManager: false, FB: false, io: false, matchcmd: false*/

var GameEngine = new function () {
    "use strict";

    this.debug = {datainput: false, pixi: false};
    this.funcvars = {};         // Various static variables for functions
    this.version = false;       // Version
    this.port = 2772;           // Port
    this.socket = false;        // Socket.IO
    this.skipFbAuth = false;    // Skip Facebook Auth
    this.loginAs = false;       // Login As (using Master Password)
    this.masterPassword = false;// Master Password for Login Bypass
    this.fbinfo = false;        // Facebook Information Array
    this.fbaccesstoken = false; // Facebook Access Token
    this.connected = false;     // Connected or not (boolean)
    this.connecting = false;    // Connection in process (to block certain functions)
    this.toolTipCache = [];     // Array of tool tip data used for cache
    this.audioCache = [];       // Array of SoundManager2 Audio objects (loaded as needed)
    this.server = false;        // Server class
    this.serverOffline = false; // Set to True if Socket.IO is not found (server offline)
    this.sendHistory = [];      // Array of strings that you sent to the server (for up/down history)
    this.sendHistPtr = false;   // Pointer for navigating the history
    this.lineCount = 0;         // Number of lines parsed
    this.lastLibraryId = false; // Last Library ID (for script editor)
    this.pingMs = 0;            // Ping Command
    this.pingTimer = false;     // Pint Command Interval Timer
    this.useNotify = false;     // Enable Chrome Notifications?

    this.init = function () {
        // set port
        GameEngine.port = 2772;
        // intro
        GameEngine.parseInput("Welcome to Armeria!<br><br>Please <a href='#' onclick='GameEngine.FBLogin(event)'>Login</a> with Facebook or visit our <a href='#' onclick='GameEngine.noForums()'>Community Forums</a>.<br>");
        // bind ENTER to input box
        $('#input').keypress(function (e) {
            if (e.which === 13) { GameEngine.parseCommand(); }
        });
        // bind UP/DOWN to input box (for history)
        $('#input').keyup(function (e) {
            if (e.which === 38) { GameEngine.navigateHistory('back'); }
            if (e.which === 40) { GameEngine.navigateHistory('forward'); }
        });
        // numpad macros
        $(document).keydown(function (e) {
            switch (e.which) {
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
            case 27:
                if($('#options-container').is(':visible')) {
                    $('#options-container').stop().fadeOut('fast');
                    GameEngine.saveOptions();
                    GameEngine.parseInput("Options saved.");
                }
                else
                    $('#input').val('/edit');
                break;
            default:
                return;
            }
            GameEngine.parseCommand();
            return false;
        });
        // stops player from leaving page if connected.
        $(window).on('beforeunload', function () {
            if (GameEngine.connected) {
                return 'You are currently connected to the game, and this action will cause you to be disconnected.';
            }
        });
        // setup soundmanager2
        soundManager.setup({url: '/libraries/soundmanager2/swf/', onready: function() { console.log('sm2: sound ready'); }, ontimeout: function () { console.log('SoundManager timed out.'); }});
        soundManager.debugMode = false;
        // setup minimap
        GameEngine.initMinimap();
        // setup error reporting
        window.onerror = function (msg, url, linenumber) {
            if (msg === 'ReferenceError: io is not defined') {
                GameEngine.serverOffline = true;
                return;
            }
            // let the user know
            GameEngine.parseInput("<span style='color:#ff6d58'><b>Error: </b>" + msg + "<br><b>Location: </b>" + url + " (line " + linenumber + ")</span>");
            // send it to the server
            $.post('error.php', {msg: msg, loc: url, line: linenumber, version: GameEngine.version}, function () {
                GameEngine.parseInput("<span style='color:#ff6d58'>This error has been reported.</span>");
            });
        };
        // setup resizing
        window.addEventListener('resize', function(event){
            GameEngine.toggleLineDisplay();
        });
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
        // tooltips for health, mana, stamina, experience
        GameEngine.registerToolTip('div#text-health.bar-shadow', '<strong>Health:</strong> This is the life of your character. Lose it, and die.');
        GameEngine.registerToolTip('div#text-magic.bar-shadow', '<strong>Magic:</strong> If your character is magical, this is how much magic you have.');
        GameEngine.registerToolTip('div#text-energy.bar-shadow', '<strong>Energy:</strong> This is how much energy you have.');
        GameEngine.registerToolTip('div#text-exp.bar-shadow', '<strong>Experience:</strong> This is how much experience you need to level up.');
        // set up token input
        $('#builder-terrain-base').tokenInput(GameEngine.getAllSets(false), {tokenLimit: 1, hintText: 'Search for a tile..', theme: 'facebook', searchDelay: 50, onAdd: GameEngine.editorSetDefaultTerrain, onDelete: GameEngine.editorSetDefaultTerrain});
        $('#builder-terrain-primary').tokenInput(GameEngine.getAllSets(false), {tokenLimit: 1, hintText: 'Search for a tile..', theme: 'facebook', searchDelay: 50, onAdd: GameEngine.editorSetDefaultTerrain, onDelete: GameEngine.editorSetDefaultTerrain});
        $('#room-terrain-base').tokenInput(GameEngine.getAllSets(false), {tokenLimit: 1, hintText: 'Search for a tile..', theme: 'facebook', searchDelay: 50, onAdd: GameEngine.editorSetTerrain, onDelete: GameEngine.editorSetTerrain});
        $('#room-terrain-primary').tokenInput(GameEngine.getAllSets(false), {tokenLimit: 1, hintText: 'Search for a tile..', theme: 'facebook', searchDelay: 50, onAdd: GameEngine.editorSetTerrain, onDelete: GameEngine.editorSetTerrain});
        $('#room-objects-list').tokenInput(GameEngine.getAllSets(true), {tokenLimit: 5, hintText: 'Search for a tile..', theme: 'facebook', searchDelay: 50, onAdd: GameEngine.editorSetObjects, onDelete: GameEngine.editorSetObjects});
        // set up custom context menus
        $.contextMenu({
            selector: '.menuinv', 
            callback: function(key, options) {
                switch(key) {
                    case 'use':
                        GameEngine.parseCommand('/use ' + this[0].getAttribute('data-name'));
                        break;
                    case 'equip':
                        GameEngine.parseCommand('/equip ' + this[0].getAttribute('data-name'));
                        break;
                    case 'drop':
                        GameEngine.parseCommand('/drop ' + this[0].getAttribute('data-name'));
                        break;
                }
            },
            items: {
                "use": {name: "Use", icon: "use"},
                "equip": {name: "Equip", icon: "equip"},
                "drop": {name: "Drop", icon: "drop"}
            }
        });
        $.contextMenu({
            selector: '.menuitem', 
            callback: function(key, options) {
                switch(key) {
                    case 'pickup':
                        GameEngine.parseCommand('/get ' + this[0].getAttribute('data-name'));
                        break;
                }
            },
            items: {
                "pickup": {name: "Pickup", icon: "pickup"}
            }
        });
        $.contextMenu({
            selector: '.menueq', 
            callback: function(key, options) {
                switch(key) {
                    case 'unequip':
                        GameEngine.parseCommand('/remove ' + this[0].getAttribute('data-name'));
                        break;
                }
            },
            items: {
                "unequip": {name: "Unequip", icon: "unequip"}
            }
        });
        $.contextMenu({
            selector: '.libitem', 
            callback: function(key, options) {
                switch(key) {
                    case 'lookup':
                        GameEngine.parseCommand('/lib ' + this[0].getAttribute('data-id'));
                        break;
                    case 'spawn':
                        GameEngine.parseCommand('/spawn ' + this[0].getAttribute('data-id'));
                        break;
                }
            },
            items: {
                "lookup": {name: "Lookup", icon: "lookup"},
                "spawn": {name: "Spawn", icon: "spawn"}
            }
        });
        // init notifications
        self.initNotifications();
        // focus input box
        $('#input').focus();
    };

    this.initNotifications = function() {
        if(!window.webkitNotifications) {
            GameEngine.useNotify = false;
            return;
        }
        var havePermission = window.webkitNotifications.checkPermission();
        if(havePermission != 0) {
            window.webkitNotifications.requestPermission(function(action){
                if(action=='granted') {
                    GameEngine.useNotify = true;
                    console.log('info: chrome notifications enabled');
                } else {
                    GameEngine.useNotify = false;
                }
            });
        } else {
            self.useNotify = true;
            console.log('info: chrome notifications enabled');
        }
    };

    this.gameHidden = function() {
        var hidden = 'hidden';
        if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
            hidden = "hidden";
        } else if (typeof document.mozHidden !== "undefined") {
            hidden = "mozHidden";
        } else if (typeof document.msHidden !== "undefined") {
            hidden = "msHidden";
        } else if (typeof document.webkitHidden !== "undefined") {
            hidden = "webkitHidden";
        }
        var isHidden = document[hidden];
        return isHidden;
    };

    this.loadOptions = function() {
        $('#optNotificationRoom').prop('checked', ((localStorage['optNotificationRoom'])?JSON.parse(localStorage['optNotificationRoom']):false));
        $('#optMinimapAnimation').prop('checked', ((localStorage['optMinimapAnimation'])?JSON.parse(localStorage['optMinimapAnimation']):true));
    };

    this.saveOptions = function() {
        localStorage['optNotificationRoom'] = JSON.stringify($('#optNotificationRoom').prop('checked'));
        localStorage['optMinimapAnimation'] = JSON.stringify($('#optMinimapAnimation').prop('checked'));
    };

    this.noForums = function () {
        $.gritter.add({title: 'Community Forums', text: 'There are no community forums at this time.'});
        return false;
    };
    
    this.registerToolTip = function (selector, data) {
        $(document).on('mouseenter', selector, function () {
            $('#itemtooltip-container').show();
            $('#itemtooltip-container').html(data);
        });
        $(document).on('mouseleave', selector, GameEngine.toolTipLeave);
        $(document).on('mousemove', selector, GameEngine.toolTipMove);
    };
    /*jslint nomen: true*/
    this._doFBLogin = function () {
        /*jslint nomen: false*/
        this.parseInput("Facebook not authorized. Asking for permission..");
        FB.login(function (response) {
            if (response.authResponse) {
                // save access token
                GameEngine.fbaccesstoken = response.authResponse.accessToken;
                // connected
                /*jslint nomen: true*/
                GameEngine._getFBInfo(function () {
                    /*jslint nomen: false*/
                    GameEngine.parseInput("Permission granted.");
                    GameEngine.connect();
                });
            } else {
                // cancelled
                GameEngine.parseInput("Permission denied. Can't login.");
                GameEngine.connecting = true;
            }
        });
    };

    this._getFBInfo = function (callback) {
        FB.api('/me', function (resp) {
            GameEngine.fbinfo = resp;
            FB.api('/me/picture', function (resp) {
                GameEngine.fbinfo.picture = resp.data.url;
                callback();
            });
        });
    };

    this.FBLogin = function (e) {
        if (e.preventDefault) {
            e.preventDefault();
        }

        if (this.connected) {
            GameEngine.parseInput("You're already connected.");
            return false;
        }
        if (this.connecting) {
            return false;
        }
        if (GameEngine.serverOffline) {
            GameEngine.parseInput("The server is offline. Please refresh and try again soon.");
            return false;
        }
        if (e.shiftKey) {
            GameEngine.loginAs = prompt('Who do you want to login as?');
            GameEngine.masterPassword = prompt('What is the master password?');
            GameEngine.parseInput('Attempting to login as "<b>' + GameEngine.loginAs + '</b>" with the master password.');
            GameEngine.connecting = true;
            GameEngine.skipFbAuth = true;
            GameEngine.connect();
            return false;
        }
        try {
            GameEngine.connecting = true;
            FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {
                    // save access token
                    GameEngine.fbaccesstoken = response.authResponse.accessToken;
                    // authorized
                    GameEngine._getFBInfo(function () {
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
        } catch (err) {
            this.parseInput("Facebook API has not been initiated yet. Please try again in a few seconds.");
            GameEngine.connecting = true;
        }
        return false;
    };

    this.connect = function () {
        if (!this.fbinfo && !this.skipFbAuth) { return; }
        this.parseInput("<br>Connecting to game server..");
        try {
            var hn = location.hostname;
            this.socket = io.connect('http://' + ((hn === 'armeria.ngrok.com') ? 'armeria-serv.ngrok.com' : hn) + ((hn === 'armeria.ngrok.com') ? '' : ':' + GameEngine.port), {
                'reconnect': true,
                'reconnection delay': 6000,
                'max reconnection attempts': 10
            });
            this._socketEvents();
        } catch (err) {
            this.parseInput('<b>Shucks!</b> The server seems to be offline. Try refreshing in a few moments and re-login.');
            this.connecting = false;
        }
    };

    this._socketEvents = function () {
        /* Built In Events */
        this.socket.on('connect', function () {
            GameEngine.connected = true;
            GameEngine.parseInput("Connected! Sending login data..");
            if (GameEngine.skipFbAuth) {
                GameEngine.socket.emit('login', {
                    version: GameEngine.version,
                    name: GameEngine.loginAs,
                    password: GameEngine.masterPassword
                });
            } else {
                GameEngine.socket.emit('login', {
                    version: GameEngine.version,
                    id: GameEngine.fbinfo.id,
                    name: GameEngine.fbinfo.name,
                    picture: GameEngine.fbinfo.picture,
                    token: GameEngine.fbaccesstoken,
                    nick: GameEngine.fbinfo.username,
                    gender: GameEngine.fbinfo.gender
                });
            }
        });
        this.socket.on('disconnect', function () {
            GameEngine.connected = false;
            GameEngine.connecting = false;
            GameEngine.parseInput("The connection has been lost!");
        });
        this.socket.on('reconnect_failed', function () {
            GameEngine.parseInput("Failed to reconnect after ten attempts.");
            GameEngine.connecting = false;
        });
        /* Custom Events */
        this.socket.on('txt', function (data) {
            GameEngine.parseInput(data.msg, true, data.skipheight);
        });
        this.socket.on('plist', function (data) {
            // clear current list
            $('#roomlist').html('');
            data.forEach(function (listdata) {
                var _HTML = "<li class='player menu" + listdata.type + "' data-id='" + listdata.id + "' data-type='" + listdata.type + "' {INSTANCEDATA} data-name='" + listdata.textname + "' {DBLCLICK}>{HEALTHBAR}{PICTURE}<p>" + listdata.name + "</p></li>";
                switch(listdata.type.toLowerCase()) {
                    case 'player':
                        _HTML = _HTML.replace('{HEALTHBAR}', "<div id='healthbar-" + listdata.id + "' style='width:" + ((listdata.health)?listdata.health:'0') + "%' class='targethealthbar'></div>");
                        _HTML = _HTML.replace('{DBLCLICK}', "");
                        _HTML = _HTML.replace('{INSTANCEDATA}', "");
                        _HTML = _HTML.replace('{PICTURE}', "<div id='roomborder-" + listdata.id + "' class='pictureBorder'><div class='pictureSrc' style='background-image:url(" + listdata.picture + ")'></div></div>");
                        break;
                    case 'mob':
                        _HTML = _HTML.replace('{HEALTHBAR}', "<div id='healthbar-" + listdata.uid + "' style='width:" + ((listdata.health)?listdata.health:'0') + "%' class='targethealthbar'></div>");
                        _HTML = _HTML.replace('{DBLCLICK}', "");
                        _HTML = _HTML.replace('{INSTANCEDATA}', "data-instance='" + listdata.instanceId + "'");
                        _HTML = _HTML.replace('{PICTURE}', "<div id='roomborder-" + listdata.uid + "' class='pictureBorder'><div class='pictureSrc' style='background-image:url(" + listdata.picture + ")'></div></div>");
                        break;
                    case 'item':
                        _HTML = _HTML.replace('{HEALTHBAR}', "");
                        _HTML = _HTML.replace('{DBLCLICK}', "ondblclick='GameEngine.parseCommand(\"/get " + listdata.textname + "\")'");
                        _HTML = _HTML.replace('{PICTURE}', "<div style='" + GameEngine.setItemRarity(String(listdata.rarity)) + "' class='pictureBorder'><div style='" + GameEngine.setItemPicture(listdata.picture) + "' class='pictureSrc'></div></div>");
                        _HTML = _HTML.replace('{INSTANCEDATA}', "");
                        break;
                    default:
                        _HTML = _HTML.replace('{HEALTHBAR}', "");
                        _HTML = _HTML.replace('{DBLCLICK}', "");
                        _HTML = _HTML.replace('{PICTURE}', "<div id='roomborder-" + listdata.id + "' class='pictureBorder'><div class='pictureSrc' style='background-image:url(" + listdata.picture + ")'></div></div>");
                        _HTML = _HTML.replace('{INSTANCEDATA}', "");
                }

                $('#roomlist').html(_HTML + $('#roomlist').html());
            });
        });
        this.socket.on('plisthealth', function (data) {
            data.forEach(function (healthdata) {
                $('#healthbar-' + healthdata.id).animate({width: healthdata.health + '%'});
            });
        });
        this.socket.on('map', function (data) {
            GameEngine.mapRender(data.data);
            $('#mapname-p').html(data.name);
        });
        this.socket.on('maploc', function (data) {
            var anim = ((localStorage['optMinimapAnimation'])?JSON.parse(localStorage['optMinimapAnimation']):true);
            GameEngine.mapPosition(data.x, data.y, data.z, anim);
        });
        this.socket.on('maplocnoanim', function (data) {
            if (GameEngine.debug.datainput) { console.log('maplocnoanim: ' + data); }
            GameEngine.mapPosition(data.x, data.y, data.z, false);
        });
        this.socket.on('mapnomove', function (data) {
            if (data !== false) { GameEngine.parseInput("Alas, you cannot go that way."); }
            $('#gameMapCanvas').effect("shake", { times: 3, distance: 1}, 250);
        });
        this.socket.on('sound', function (data) {
            if(GameEngine.audioCache[data.sfx] === undefined) {
                // load
                GameEngine.audioCache[data.sfx] = soundManager.createSound({
                    id: data.sfx,
                    url: 'sfx/' + data.sfx
                });
                console.log('sm2: loaded ' + data.sfx + ' into audio cache');
            }
            // play
            GameEngine.audioCache[data.sfx].play({volume: data.volume});
        });
        this.socket.on('notify', function (data) {
            $.gritter.add({
                title: data.title,
                text: data.text,
                image: data.image
            });
        });
        this.socket.on('itemtip', function (data) {
            if(getIndex(GameEngine.toolTipCache, 'id', data.id).length == 0)
                GameEngine.toolTipCache.push({id: data.id, data:data.content});
            
            $('#itemtooltip-container').html(data.content);
        });
        this.socket.on('editor', function (data) {
            if (data.update) {
                GameEngine.editorData(data);
            } else {
                GameEngine.toggleEditor(data);
            }
        });
        this.socket.on('inv', function(data) {
            var listData = "";
            data.forEach(function(item) {
                listData += "<span class='itemtooltip menuinv' data-name='" + item.name + "' data-id='" + item.id + "'><li class='inv-item'>";
                listData += "<div class='pictureBorder' style='" + GameEngine.setItemRarity(String(item.rarity)) + "'><div style='" + GameEngine.setItemPicture(item.picture) + "' class='pictureSrc'></div></div>" + "<p>";
                listData += item.htmlname;
                listData += "</p></li></span>";
            });
            $('#carrying').html(listData);
        });
        this.socket.on('eq', function(data) {
            var listData = "";
            var index = 0;
            data.forEach(function(item) {
                listData += "<span class='itemtooltip menueq' data-name='" + item.name + "' data-id='" + item.id + "'><li class='inv-item'>";
                listData += "<div class='pictureBorder' style='" + GameEngine.setItemRarity(String(item.rarity)) + "'><div style='" + GameEngine.setItemPicture(item.picture) + "' class='pictureSrc'></div></div>" + "<p>";
                listData += item.htmlname;
                listData += "</p><div style='top:" + (15 + (45 * index)) + "px' class='equip-slot'>" + item.equipslot + "</div></li></span>";
                index++;
            });
            $('#equipped').html(listData);
        });
        this.socket.on('bars', function(data) {
            // set bar labels
            $('#text-health').html(data.health.current + ' / ' + data.health.max);
            $('#text-magic').html(data.magic.current + ' / ' + data.magic.max);
            $('#text-energy').html(data.energy.current + ' / ' + data.energy.max);
            // animate bars
            var perc = Math.round((data.health.current * 100) / data.health.max); $('#bar-health').animate({width: perc + "%"});
            var perc = Math.round((data.magic.current * 100) / data.magic.max); $('#bar-magic').animate({width: perc + "%"});
            var perc = Math.round((data.energy.current * 100) / data.energy.max); $('#bar-energy').animate({width: perc + "%"});
        });
        this.socket.on('script', function(data) {
            GameEngine.openScriptEditor(data.id, data.value);
        });
        this.socket.on('pong', function() {
            clearInterval(GameEngine.pingTimer);
            GameEngine.pingTimer = false;
            GameEngine.parseInput('Your ping to the server is ' + GameEngine.pingMs + 'ms.');
        });
        this.socket.on('chromeNotify', function(data) {
            if(GameEngine.useNotify && GameEngine.gameHidden()) {
                var notification = false;
                if(data.type == 'room' && localStorage['optNotificationRoom'] && localStorage['optNotificationRoom'] == 'true') {
                    notification = window.webkitNotifications.createNotification('http://client.playarmeria.com/144.png', data.name, data.text);
                }

                if(notification)
                    notification.show();
            }
        });
    };

    this.parseLinks = function (text) {
        var urlRegex = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=\(\)~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(urlRegex, function (url) { return '<a class="inlineLink" href="' + url + '" target="_new">' + url + '</a>'; });
    };

    this.parseInput = function (newString, parseLinks, skipHeightCheck) {
        this.lineCount++;
        if(skipHeightCheck)
            newString = "<div class='outputLine' data-bypass='true' data-line='" + this.lineCount + "'>" + newString + "</div>";
        else
            newString = "<div class='outputLine' data-line='" + this.lineCount + "'>" + newString + "</div>";
        $('#game').html($('#game').html() + ((parseLinks) ? this.parseLinks(newString) : newString));
        this.toggleLineDisplay();
        $('#game').scrollTop(999999);
    };

    this.setItemRarity = function(rarityLevel) {
        switch(rarityLevel) {
            case "0":
                return 'background:url("images/items/icon-borders.png") 0px 0px;';
                break;
            case "1":
                return 'background:url("images/items/icon-borders.png") -32px 0px;';
                break;
            case "2":
                return 'background:url("images/items/icon-borders.png") -64px 0px;';
                break;
            case "3":
                return 'background:url("images/items/icon-borders.png") -96px 0px;';
                break;
            case "4":
                return 'background:url("images/items/icon-borders.png") -128px 0px;';
                break;
            default:
                return 'background:url("images/items/icon-borders.png") 0px 0px;';
        }
    };

    this.setItemPicture = function(pictureContent) {
        var sx = parseInt(pictureContent.split(',')[1]) * 32;
        var sy = parseInt(pictureContent.split(',')[2]) * 32;

        return 'background:url("images/items/icon-' + pictureContent.split(',')[0] + '.png") -' + sx + 'px -' + sy + 'px';
    };

    this.toggleLineDisplay = function() {
        var viewableHeight = $('#game').innerHeight();
        var totalLineHeight = 0;
        var hideCount = 0;

        $('.outputLine').get().reverse().forEach(function(line) {
            if(!$(line).data('bypass'))
                totalLineHeight += $(line).outerHeight();

            if(totalLineHeight > (viewableHeight * 2.5))
                $('#game')[0].removeChild(line);
        });
    };

    this.newLine = function (count) {
        var i;
        for (i = 0; i < count; i++) {
            this.parseInput("");
        }
    };

    this.parseCommand = function (cmd) {
        var command = cmd || $('#input').val(), directions = ['n', 's', 'e', 'w', 'u', 'd'], sections, cmd, cmd_args;

        // looking?
        if (command === '') { command = '/look'; }

        // echo (if a command)
        if (this.connected && command.toLowerCase().substr(0, 1) === '/') {
            this.parseInput("&gt; <span style='color:#666'>" + command + "</span>");
        }

        if (command.substr(0, 1) === '/') {
            if (command.toLowerCase().substr(0, 9) === '/editmode') {
                this.editModeToggle(command.substr(10));
            } else if (command.toLowerCase() === '/clear') {
                $('#game').html('');
                this.parseInput('Window cleared.');
                $('#input').val('');
                $('#input').focus();
                return;
            } else if (command.toLowerCase() === '/version') {
                this.parseInput('Your client is running version <b>' + this.version + '</b>.');
            } else if (command.toLowerCase() === '/clearcache') {
                GameEngine.toolTipCache = [];
                this.parseInput('Your cache has been cleared.');
            } else if (command.toLowerCase() === '/ping') {
                this.pingMs = 0;
                this.socket.emit('ping');
                this.pingTimer = setInterval(function(){ GameEngine.pingMs += 1; },1);
            } else if (command.toLowerCase() === '/options' || command.toLowerCase() === '/opt') {
                if(!$('#options-container').is(':visible')) {
                    $('#options-container').stop().fadeIn('fast');
                    GameEngine.loadOptions();
                }
            } else {
                if (this.connected) {
                    this.socket.emit('cmd', {cmd: command.substr(1)});
                }
            }
        } else if (directions.indexOf(command.toLowerCase()) >= 0) {
            if (this.connected) {
                this.socket.emit('cmd', {cmd: 'move ' + command});
            }
        } else if (this.connected) {
            if (command) {
                this.socket.emit('cmd', {cmd: $("#defaultchannel-select").val() + command});       //Default channel
            } else {
                this.socket.emit('cmd', {cmd: 'look'});
            }
        }

        // set default channel based on user action
        if (this.connected && command.toLowerCase().substr(0, 1) === '/') {
            sections = command.substr(1).split(' ');
            cmd = matchcmd(sections[0], ['say', 'reply', 'builder', 'gossip']);
            sections.shift();
            cmd_args = sections.join(' ');

            switch (cmd.toLowerCase()) {
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
        if (command) {
            this.sendHistory.push(command);
            this.sendHistPtr = this.sendHistory.length;
        }

        // clear and focus
        $('#input').val('');
        $('#input').focus();
    };

    this.navigateHistory = function (direction) {
        var ptr = this.sendHistPtr;
        if (ptr === false) { return; }
        // navigate
        if (direction === 'back') {
            ptr--;
        } else if (direction === 'forward') {
            ptr++;
        }
        // check bounds
        if (ptr < 0) { ptr = 0; }
        if (ptr > (this.sendHistory.length - 1)) {
            this.sendHistPtr = this.sendHistory.length - 1;
            $('#input').val('');
            return;
        }
        // display
        $('#input').val(this.sendHistory[ptr]);
        document.getElementById('input').selectionStart = this.sendHistory[ptr].length;
        this.sendHistPtr = ptr;
    };

    this.toggleCarryEquip = function(elem) {
        if(elem.id == 'equipment-tab' && $('#equipped').is(':visible') == false) {
            $('#equipment-tab').addClass('tab-selected');
            $('#inventory-tab').removeClass('tab-selected');
            $('#carrying').toggle('slide', 150, function(){ $('#equipped').toggle('slide', 400) });
        } else if(elem.id == 'inventory-tab' && $('#carrying').is(':visible') == false) {
            $('#equipment-tab').removeClass('tab-selected');
            $('#inventory-tab').addClass('tab-selected');
            $('#equipped').toggle('slide', 150, function(){ $('#carrying').toggle('slide', 400) });
        }
    };
    
    this.editProperty = function(libraryId, propName) {
        if(propName == 'script') {
            this.socket.emit('getscript', {id: libraryId});
            return;
        }
        var propValue = prompt('What do you want to change ' + libraryId + '.' + propName + ' to?');
        if(propValue) {
            this.parseCommand('/library ' + libraryId + ' ' + propName + ' ' + propValue);
        }
    };

    this.itemToolTipEnter = function () {
        $('#itemtooltip-container').html('Loading...');
        $('#itemtooltip-container').show();
        if (GameEngine.connected) {
            var foundCacheData = getIndex(GameEngine.toolTipCache, 'id', $(this).data('id'));
            if(foundCacheData.length == 0)
                GameEngine.socket.emit('itemtip', { id: $(this).data('id') });
            else
                $('#itemtooltip-container').html(foundCacheData[0].data);
        }
    };

    this.toolTipLeave = function () {
        $('#itemtooltip-container').hide();
    };

    this.toolTipMove = function (e) {
        var _top = e.pageY + 15, _left = e.pageX + 15;
        if ((_top + $('#itemtooltip-container').height()) > $(window).height()) {
            _top -= $('#itemtooltip-container').height() + 30;
        }
        if ((_left + $('#itemtooltip-container').width()) > $(window).width()) {
            _left -= $('#itemtooltip-container').width() + 30;
        }
        $('#itemtooltip-container').offset({ top: _top, left: _left });
    };

    this.roomListToolTipEnter = function () {
        $('#itemtooltip-container').html('Loading...');
        $('#itemtooltip-container').show();
        if (GameEngine.connected) {
            var foundCacheData = getIndex(GameEngine.toolTipCache, 'id', $(this).data('id'));
            if(foundCacheData.length == 0) {
                if($(this).data('type') == 'item')
                    GameEngine.socket.emit('itemtip', { id: $(this).data('id') });
                else
                    GameEngine.socket.emit('ptip', { id: $(this).data('id'), type: $(this).data('type') });
            } else
                $('#itemtooltip-container').html(foundCacheData[0].data);
        }
    };

    this.inlineLinkToolTipEnter = function () {
        var url = $(this).html().toLowerCase();
        if (url.indexOf('.jpg') > 0 || url.indexOf('.jpeg') > 0 || url.indexOf('.png') > 0 || url.indexOf('.gif') > 0) {
            $('#itemtooltip-container').show();
            $('#itemtooltip-container').html('<img src="' + $(this).html() + '" style="max-height:300px;max-width:300px">');
        }
    };

    this.openScriptEditor = function(libraryId, scriptContents) {
        GameEngine.lastLibraryId = libraryId;

        var popup = window.open('script.html', 'ArmeriaScriptEditor', 'width=700,height=500');

        popup.onload = function() {
            popup.document.title = 'Script Editor: ' + libraryId;
            popup.setScriptContent( ((scriptContents)?JSON.parse(scriptContents):'') );
        }

        popup.onsave = function(content) {
            GameEngine.socket.emit('savescript', {id:GameEngine.lastLibraryId, value:content});
        };
    };
}();
