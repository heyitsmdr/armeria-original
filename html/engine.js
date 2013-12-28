/*
 Armeria Game Engine
 Created by Mike Du Russel & Josh Schmille
 Copyright 2012 - 2013
 Questions? info@playarmeria.com
 */
/*jslint browser: true, plusplus: true, continue: true*/
/*global  console: false, prompt: false, $: false, soundManager: false, FB: false, io: false, matchcmd: false*/

var GameEngine = new function () {
    "use strict";
    this.debug = {datainput: false};
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
    this.tilesets = [];         // Tilesets
    this.mapdata = false;       // Entire minimap data
    this.mapz = 0;              // Map Z-Coordinate
    this.maproom = false;       // Object within this.mapdata that contains the current room
    this.mapctx = false;        // Minimap Canvas 2D Context
    this.mapcv = false;         // Minimap Canvas
    this.maptileset = [];       // Images of Tilesets
    this.mapts = [];            // Image Properties
    this.mapanim = false;       // Map Animation for setInterval
    this.mapoffsetx = 0;        // Minimap offset - x
    this.mapoffsety = 0;        // Minimap offset - y
    this.mapdestoffsetx = 0;    // Minimap destination offset - x
    this.mapdestoffsety = 0;    // Minimap destination offset - y
    this.mapmarker = false;     // Image of Map Marker
    this.server = false;        // Server class
    this.serverOffline = false; // Set to True if Socket.IO is not found (server offline)
    this.sendHistory = [];      // Array of strings that you sent to the server (for up/down history)
    this.sendHistPtr = false;   // Pointer for navigating the history

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
        soundManager.setup({url: '/libraries/soundmanager2/swf/', ontimeout: function () { console.log('SoundManager timed out.'); }});
        soundManager.debugMode = false;
        // grab 2d context for map and load tileset
        GameEngine.mapcv = document.getElementById('map-canvas');
        GameEngine.mapctx = GameEngine.mapcv.getContext('2d');
        GameEngine.mapctx.lineWidth = 3;
        GameEngine.mapctx.lineJoin = 'round';
        GameEngine.mapctx.strokeStyle = '#ffffff';
        GameEngine.setupTileset();
        GameEngine.mapmarker = new Image();
        GameEngine.mapmarker.src = "images/tiles/playerMark.png";
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
        // request animation frame
        var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
        window.requestAnimationFrame = requestAnimationFrame;
        // focus input box
        $('#input').focus();
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

    this.setupTileset = function () {
        /* TILE DEFINITIONS */
        GameEngine.tilesets = ['floors'];

        /* NOTE: Edges are automatically calculated since they will always be
                 to the right of the tile (if edges = true). */

        //GameEngine.mapts['floors'] = [
        GameEngine.mapts.floors = [
            {def: 'grass', sx: 0, sy: 0, edges: true},
            {def: 'dirt', sx: 0, sy: 1, edges: true}
        ];

        // Calculate Real sx and sy && Calculate edges (if needed) && Load images
        GameEngine.tilesets.forEach(function (tset) {
            GameEngine.tsSetReal(GameEngine.mapts[tset]);
            GameEngine.mapts[tset].forEach(function (ts) { if (ts.edges) { GameEngine.tsSetEdges(ts); } });
            GameEngine.maptileset[tset] = new Image();
            GameEngine.maptileset[tset].src = "images/tiles/" + tset + ".png";
        });
    };

    this.tsSetReal = function (ts) {
        ts.forEach(function (tile) {
            tile.sx *= 32;
            tile.sy *= 32;
        });
    };

    this.tsSetEdges = function (tile) {
        tile.edgeTop = tile.sx + 32;
        tile.edgeRight = tile.sx + 64;
        tile.edgeBottom = tile.sx + 96;
        tile.edgeLeft = tile.sx + 128;
        tile.cornerTopLeft = tile.sx + 160;
        tile.cornerTopRight = tile.sx + 192;
        tile.cornerBottomRight = tile.sx + 224;
        tile.cornerBottomLeft = tile.sx + 256;
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
            FB.api('/' + GameEngine.fbinfo.id + '?fields=picture', function (resp) {
                GameEngine.fbinfo.picture = resp.picture.data.url;
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
                'reconnection delay': 1000,
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
                    nick: GameEngine.fbinfo.username
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
            GameEngine.parseInput(data.msg, true);
        });
        this.socket.on('plist', function (data) {
            // clear current list
            $('#roomlist').html('');
            data.forEach(function (listdata) {
                if (listdata.picture === false) {
                    $('#roomlist').html("<li class='player' data-id='" + listdata.id + "' data-type='" + listdata.type + "'><p style='padding-left: 15px'>" + listdata.name + "</p></li>" + $('#roomlist').html());
                } else {
                    $('#roomlist').html("<li class='player' data-id='" + listdata.id + "' data-type='" + listdata.type + "'><img src='" + listdata.picture + "' width='40px' height='40px'><p>" + listdata.name + "</p></li>" + $('#roomlist').html());
                }
            });
        });
        this.socket.on('map', function (data) {
            GameEngine.mapRender(data.data);
            $('#mapname-p').html(data.name);
        });
        this.socket.on('maploc', function (data) {
            GameEngine.mapPosition(data.x, data.y, data.z, true);
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
            if (!soundManager.play(data.sfx, {volume: data.volume})) {
                // load sound
                soundManager.createSound({id: data.sfx, url: 'sfx/' + data.sfx});
                // now play it
                soundManager.play(data.sfx, {volume: data.volume});
            }
        });
        this.socket.on('notify', function (data) {
            $.gritter.add({
                title: data.title,
                text: data.text,
                image: data.image
            });
        });
        this.socket.on('itemtip', function (data) {
            $('#itemtooltip-container').html(data.content);
        });
        this.socket.on('editor', function (data) {
            if (data.update) {
                GameEngine.editorData(data);
            } else {
                GameEngine.toggleEditor(data);
            }
        });
    };

    this.parseLinks = function (text) {
        var urlRegex = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=\(\)~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(urlRegex, function (url) { return '<a class="inlineLink" href="' + url + '" target="_new">' + url + '</a>'; });
    };

    this.parseInput = function (newString, parseLinks) {
        $('#game').html($('#game').html() + ((parseLinks) ? this.parseLinks(newString) : newString) + '<br>');
        $('#game').scrollTop(999999);
    };

    this.newLine = function (count) {
        var i;
        for (i = 0; i < count; i++) {
            this.parseInput("");
        }
    };

    function matchcmd(cmd, cmdlist) {
        var cmd_real = cmd, i, j;
        for (i = 0; i < cmdlist.length; i++) {
            if (typeof cmdlist[i] === 'object') {
                for (j = 0; j < cmdlist[i].length; j++) {
                    if (cmdlist[i][j].length >= cmd.length && cmdlist[i][j].substr(0, cmd.length) === cmd.toLowerCase()) {
                        return cmdlist[i][0];
                    }
                }
            } else if (cmdlist[i].length >= cmd.length && cmdlist[i].substr(0, cmd.length) === cmd.toLowerCase()) {
                return cmdlist[i];
            }
        }
        return cmd_real;
    }

    this.parseCommand = function () {
        var command = $('#input').val(), directions = ['n', 's', 'e', 'w', 'u', 'd'], sections, cmd, cmd_args;

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

    this.mapGetTilesetDefinition = function (definition) {
        var tileset = definition.split('.')[0], tile = definition.split('.')[1], k;
        for (k = 0; k < GameEngine.mapts[tileset].length; k++) {
            if (GameEngine.mapts[tileset][k].def.toLowerCase() === tile.toLowerCase()) {
                return GameEngine.mapts[tileset][k];
            }
        }

        // default to grass
        return GameEngine.mapts[tileset][0];
    };

    this.mapRender = function (mapdata, offsetx, offsety) {
        var i, x, y, z, left, top, layerBase, layerPrimary, layerEdgeCorners, defBase, defPrimary, tsBase, tsPrimary;
        if (mapdata === false) {
            mapdata = this.mapdata;
        } else {
            this.mapdata = mapdata;
            GameEngine.mapRenderLight(GameEngine.maproom);
        }
        if (offsetx === undefined) { offsetx = GameEngine.mapoffsetx; }
        if (offsety === undefined) { offsety = GameEngine.mapoffsety; }
        GameEngine.mapoffsetx = offsetx;
        GameEngine.mapoffsety = offsety;
        // clear canvas
        GameEngine.mapctx.clearRect(0, 0, GameEngine.mapcv.width, GameEngine.mapcv.height);
        // draw rooms
        for (i = 0; i < mapdata.length; i++) {
            x = parseInt(mapdata[i].x, 10);
            y = parseInt(mapdata[i].y, 10);
            z = parseInt(mapdata[i].z, 10);
            if (z !== GameEngine.mapz) { continue; } // skip
            left = (x * 32) + offsetx;
            top = (y * 32) + offsety;
            // only render within viewport
            if (left > -32 && left < 255 && top > -32 && top < 255) {
                layerBase = mapdata[i].terrain.split(' ')[0];
                layerPrimary = mapdata[i].terrain.split(' ')[1];
                layerEdgeCorners = mapdata[i].terrain.split(' ')[2];

                defBase = GameEngine.mapGetTilesetDefinition(layerBase);
                defPrimary = GameEngine.mapGetTilesetDefinition(layerPrimary);

                tsBase = layerBase.split('.')[0];
                tsPrimary = layerPrimary.split('.')[0];

                // render primary
                GameEngine.mapctx.globalCompositeOperation = 'source-over';
                GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.sx, defPrimary.sy, 32, 32, left, top, 32, 32);

                // render edges and corners
                GameEngine.mapctx.globalCompositeOperation = 'destination-out';
                if (layerEdgeCorners.substr(0, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeTop, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(1, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeRight, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(2, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeBottom, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(3, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeLeft, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(4, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerTopLeft, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(5, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerTopRight, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(6, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerBottomRight, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(7, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerBottomLeft, defPrimary.sy, 32, 32, left, top, 32, 32); }

                // render base
                GameEngine.mapctx.globalCompositeOperation = 'destination-over';
                GameEngine.mapctx.drawImage(GameEngine.maptileset[tsBase], defBase.sx, defBase.sy, 32, 32, left, top, 32, 32);
            }
        }
        // redraw editor (if open)
        if ($('#editor-container').css('display') !== 'none') {
            GameEngine.editorRender(false);
        }
    };

    this.mapGridAt = function (x, y, z) {
        var i, nX, nY, nZ, mapX, mapY, mapZ;
        nX = Number(x);
        nY = Number(y);
        nZ = Number(z);
        
        if (!this.mapdata) { return; }
        for  (i = 0; i < this.mapdata.length; i++) {
            mapX = Number(this.mapdata[i].x);
            mapY = Number(this.mapdata[i].y);
            mapZ = Number(this.mapdata[i].z);
            if (mapX === nX && mapY === nY && mapZ === nZ) { return this.mapdata[i]; }
        }
        return false;
    };

    this.mapPosition = function (x, y, z, anim) {
        if (!this.mapdata) { console.log('GameEngine.mapPosition(' + x + ', ' + y + ', ' + z + '): failed - local map cache empty'); return; }
        if (!this.mapGridAt(x, y, z)) { console.log('GameEngine.mapPosition(' + x + ', ' + y + ', ' + z + '): failed - destination doesnt exist in local map cache'); return; }
        if (this.mapz !== z) {
            this.mapz = z; // save current floor level for renderMap
        }
        // calculate offsets
        this.mapdestoffsetx = 112 - (x * 32);
        this.mapdestoffsety = 112 - (y * 32);
        // lighting?
        this.maproom = this.mapGridAt(x, y, z);
        // use animation?
        if (anim && GameEngine.mapanim === false) {
            GameEngine.mapanim = setInterval(function () {
                var done = 0;
                // X
                if (GameEngine.mapoffsetx < GameEngine.mapdestoffsetx) {
                    GameEngine.mapRender(false, (GameEngine.mapoffsetx + 1), GameEngine.mapoffsety);
                } else if (GameEngine.mapoffsetx > GameEngine.mapdestoffsetx) {
                    GameEngine.mapRender(false, (GameEngine.mapoffsetx - 1), GameEngine.mapoffsety);
                } else {
                    done++;
                }
                // Y
                if (GameEngine.mapoffsety < GameEngine.mapdestoffsety) {
                    GameEngine.mapRender(false, GameEngine.mapoffsetx, (GameEngine.mapoffsety + 1));
                } else if (GameEngine.mapoffsety > GameEngine.mapdestoffsety) {
                    GameEngine.mapRender(false, GameEngine.mapoffsetx, (GameEngine.mapoffsety - 1));
                } else {
                    done++;
                }
                // Animation complete?
                if (done === 2) {
                    clearInterval(GameEngine.mapanim);
                    GameEngine.mapanim = false;
                } else {
                    GameEngine.mapRenderLight(GameEngine.maproom);
                }
            }, 1);
        } else {
            GameEngine.mapRender(false, this.mapdestoffsetx, this.mapdestoffsety);
            GameEngine.mapRenderLight(GameEngine.maproom);
        }
    };

    this.mapRenderLight = function (room) {
        if (room.env === 'underground') {
            GameEngine.mapLightRadius(0.3, '20,20,1');
        }
    };

    this.mapLightRadius = function (radius, color) {
        GameEngine.mapctx.beginPath();
        var rad = GameEngine.mapctx.createRadialGradient(120, 120, 1, 120, 120, 240);
        rad.addColorStop(0, 'rgba(' + color + ',0)');
        rad.addColorStop(radius, 'rgba(' + color + ',1)');
        GameEngine.mapctx.fillStyle = rad;
        GameEngine.mapctx.arc(120, 120, 240, 0, Math.PI * 2, false);
        GameEngine.mapctx.fill();
    };

    this.itemToolTipEnter = function () {
        $('#itemtooltip-container').html('Loading...');
        $('#itemtooltip-container').show();
        if (GameEngine.connected) {
            GameEngine.socket.emit('itemtip', { id: $(this).data('id') });
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
            GameEngine.socket.emit('ptip', { id: $(this).data('id'), type: $(this).data('type') });
        }
    };

    this.inlineLinkToolTipEnter = function () {
        var url = $(this).html().toLowerCase();
        if (url.indexOf('.jpg') > 0 || url.indexOf('.jpeg') > 0 || url.indexOf('.png') > 0 || url.indexOf('.gif') > 0) {
            $('#itemtooltip-container').show();
            $('#itemtooltip-container').html('<img src="' + $(this).html() + '" style="max-height:300px;max-width:300px">');
        }
    };

    this.editorToggleExtra = function (toggleId) {
        if ($('#' + toggleId).css('display') === 'none') {
            $('#' + toggleId).show('slide', {direction: 'up'});
        } else {
            $('#' + toggleId).hide('slide', {direction: 'up'});
        }
    };

    this.toggleEditor = function (data) {
        if ($('#editor-container').css('display') === 'none') {
            $('#editor-container').stop().fadeIn('fast', function () {
                // ready
                GameEngine.editorInit(16, 16);
                GameEngine.editorRender(false);
                GameEngine.editorData(data);
            });
        } else {
            $('#editor-container').stop().fadeOut('fast');
        }
    };

    this.editorData = function (data) {
        // area data
        $('#map-name').html(data.mapData.name);
        $('#map-author').html(data.mapData.author);

        // room data
        $('#room-name').html(data.roomData.name);

        $('#room-desc').html(data.roomData.desc);
        GameEngine.registerToolTip('#room-desc', data.roomData.desc);

        $('#room-terrain').html(data.roomData.type);
        GameEngine.registerToolTip('#room-terrain', data.roomData.type);
        $('#room-terrain-base').html('');
        $('#room-terrain-primary').html('');
        $('#builder-terrain-base').html('');
        $('#builder-terrain-primary').html('');
        GameEngine.tilesets.forEach(function (ts) {
            GameEngine.mapts[ts].forEach(function (tile) {
                var def = ts + '.' + tile.def;
                $('#room-terrain-base').append('<option ' + ((def === data.roomData.type.split(' ')[0]) ? 'selected' : '') + '>' + def + '</option>');
                $('#room-terrain-primary').append('<option ' + ((def === data.roomData.type.split(' ')[1]) ? 'selected' : '') + '>' + def + '</option>');
                $('#builder-terrain-base').append('<option>' + def + '</option>');
                $('#builder-terrain-primary').append('<option>' + def + '</option>');
            });
        });
        $('#room-terrain-corners-t').prop('checked', ((data.roomData.type.split(' ')[2].substr(0, 1) === '1') ? true : false));
        $('#room-terrain-corners-r').prop('checked', ((data.roomData.type.split(' ')[2].substr(1, 1) === '1') ? true : false));
        $('#room-terrain-corners-b').prop('checked', ((data.roomData.type.split(' ')[2].substr(2, 1) === '1') ? true : false));
        $('#room-terrain-corners-l').prop('checked', ((data.roomData.type.split(' ')[2].substr(3, 1) === '1') ? true : false));
        $('#room-terrain-corners-tl').prop('checked', ((data.roomData.type.split(' ')[2].substr(4, 1) === '1') ? true : false));
        $('#room-terrain-corners-tr').prop('checked', ((data.roomData.type.split(' ')[2].substr(5, 1) === '1') ? true : false));
        $('#room-terrain-corners-br').prop('checked', ((data.roomData.type.split(' ')[2].substr(6, 1) === '1') ? true : false));
        $('#room-terrain-corners-bl').prop('checked', ((data.roomData.type.split(' ')[2].substr(7, 1) === '1') ? true : false));

        $('#room-environment').html(data.roomData.environment);
        // section title
        $('#section-roomprops').html('Current Room Properties (' + data.roomData.x + ',' + data.roomData.y + ',' + data.roomData.z + ')');
    };

    this.editorSetTerrain = function () {
        var typeString = $('#room-terrain-base').val() + ' ' + $('#room-terrain-primary').val() + ' ';
        if ($('#room-terrain-corners-t').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
        if ($('#room-terrain-corners-r').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
        if ($('#room-terrain-corners-b').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
        if ($('#room-terrain-corners-l').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
        if ($('#room-terrain-corners-tl').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
        if ($('#room-terrain-corners-tr').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
        if ($('#room-terrain-corners-br').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
        if ($('#room-terrain-corners-bl').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
        // set within editor
        $('#room-terrain').html(typeString);
        // send to server
        GameEngine.socket.emit('cmd', {cmd: 'modify room terrain ' + typeString});
    };

    this.editorSetDefaultTerrain = function () {
        $('#builder-terrain').html($('#builder-terrain-base').val() + ' ' + $('#builder-terrain-primary').val());
    };

    this.editorChangeClickAction = function () {
        if ($('#builder-clickaction').html() === 'teleport') {
            $('#builder-clickaction').html('build');
        } else {
            $('#builder-clickaction').html('teleport');
        }
    };

    this.editorEditProperty = function (prop) {
        var newContent = prompt('Set property to:', $(prop).html());
        if (newContent) {
            // set within editor
            $(prop).html(newContent);
            // send to server
            if ($(prop).attr('id').split('-')[0] === 'room') {
                GameEngine.socket.emit('cmd', {cmd: 'modify room ' + $(prop).attr('id').split('-')[1] + ' ' + newContent});
            }
        }
    };

    /**
        Note: sizeh and sizew must be divisible by 2.
        Todo: Move styles to stylesheet
    **/
    this.editorInit = function (sizeh, sizew) {
        var width = (sizew + 1) * 32, height = (sizeh + 1) * 32;
        $('#editor-grids').html('<canvas id="editor-canvas" width="' + width + '" height="' + height + '" onclick="GameEngine.editorClick(event)"></canvas>');
    };

    this.editorClick = function (evt) {
        var sizew, sizeh, x, y;
        // calculate relative x and y
        sizew = (document.getElementById('editor-canvas').width / 32) - 1;
        sizeh = (document.getElementById('editor-canvas').height / 32) - 1;
        x = Math.floor((evt.x - $('#editor-canvas').offset().left) / 32) - (sizew / 2);
        y = Math.floor((evt.y - $('#editor-canvas').offset().top) / 32) - (sizeh / 2);
        // convert to absolute (based on current location)
        x = parseInt(GameEngine.maproom.x, 10) + parseInt(x, 10);
        y = parseInt(GameEngine.maproom.y, 10) + parseInt(y, 10);
        // send to server
        if ($('#builder-clickaction').html() === 'teleport') {
            GameEngine.socket.emit('cmd', {cmd: 'tp ' + x + ' ' + y});
        } else if ($('#builder-clickaction').html() === 'build') {
            if ($('#builder-terrain').html() === 'null null') {
                $.gritter.add({title: 'Build Error', text: 'Please set a Default Terrain before building.'});
            } else {
                GameEngine.socket.emit('cmd', {cmd: 'create room @' + x + ',' + y + ',' + GameEngine.maproom.z + ' -terrain "' + $('#builder-terrain').html() + ' 00000000"'});
            }
        }
        GameEngine.socket.emit('cmd', {cmd: 'edit refresh'});
    };

    this.editorRender = function (location) {
        if (!location) {
            location = GameEngine.maproom;
        }
        if (!location) {
            console.log('GameEngine.editorRender(' + location + ') failed - location was false');
            return false;
        }
        
        var ctx, sizew, sizeh, xrangemin, xrangemax, yrangemin, yrangemax, offsetx, offsety, x, y, left, top, grid, layerBase, layerPrimary, layerEdgeCorners, defBase, defPrimary, tsBase, tsPrimary;
        
        ctx = document.getElementById('editor-canvas').getContext('2d');

        sizew = (document.getElementById('editor-canvas').width / 32) - 1;
        sizeh = (document.getElementById('editor-canvas').height / 32) - 1;
        xrangemin = parseInt(location.x, 10) - (sizew / 2);
        xrangemax = parseInt(location.x, 10) + (sizew / 2);
        yrangemin = parseInt(location.y, 10) - (sizeh / 2);
        yrangemax = parseInt(location.y, 10) + (sizeh / 2);
        offsetx = 0;
        offsety = 0;

        ctx.clearRect(0, 0, $('#editor-canvas').width(), $('#editor-canvas').height());
        
        for (y = yrangemin; y <= yrangemax; y++) {
            for (x = xrangemin; x <= xrangemax; x++) {
                left = offsetx;
                top = offsety;
                
                offsetx += 32;
                
                grid = GameEngine.mapGridAt(x, y, location.z);
                if (!grid) {
                    continue;
                }

                layerBase = grid.terrain.split(' ')[0];
                layerPrimary = grid.terrain.split(' ')[1];
                layerEdgeCorners = grid.terrain.split(' ')[2];

                defBase = GameEngine.mapGetTilesetDefinition(layerBase);
                defPrimary = GameEngine.mapGetTilesetDefinition(layerPrimary);

                tsBase = layerBase.split('.')[0];
                tsPrimary = layerPrimary.split('.')[0];

                // render primary
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.sx, defPrimary.sy, 32, 32, left, top, 32, 32);

                // render edges and corners
                ctx.globalCompositeOperation = 'destination-out';
                if (layerEdgeCorners.substr(0, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeTop, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(1, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeRight, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(2, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeBottom, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(3, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeLeft, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(4, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerTopLeft, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(5, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerTopRight, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(6, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerBottomRight, defPrimary.sy, 32, 32, left, top, 32, 32); }
                if (layerEdgeCorners.substr(7, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerBottomLeft, defPrimary.sy, 32, 32, left, top, 32, 32); }

                // render base
                ctx.globalCompositeOperation = 'destination-over';
                ctx.drawImage(GameEngine.maptileset[tsBase], defBase.sx, defBase.sy, 32, 32, left, top, 32, 32);

                // render marker if current (or rendered) location
                if (x === location.x && y === location.y) {
                    ctx.globalCompositeOperation = 'source-over';
                    ctx.drawImage(GameEngine.mapmarker, 0, 0, 30, 30, left + 1, top + 1, 30, 30);
                }
            }
            offsetx = 0;
            offsety += 32;
        }
    };
}();