var fs        = require('fs');
var data_path = __dirname + '/../data/maps/';

var World = function() {
    var self = this;
    
    self.maps = [];     // array of objects (Map)
    
    self.init = function() {
        console.log('[init] loading world..');
        self.maps = [];
        fs.readdir(data_path, function (err, files) {
            // load all maps
            for(i in files) {
                var map_file = data_path + files[i];
                if(!fs.statSync(map_file).isFile()) {
                    console.log('[init] error: invalid map file (' + map_file + ')');
                    continue;
                }
                self.maps.push(new Map(JSON.parse(fs.readFileSync(map_file).toString('utf8')), files[i]));
            }
        });
    };
    
    self.getMap = function(mapname) {
        for(var i = 0; i < self.maps.length; i++) {
            if(self.maps[i].name.toLowerCase()==mapname.toString().toLowerCase()) return self.maps[i];
        }
        return false;
    };
    
    self.eachMap = function(callback) {
        self.maps.forEach(function(map){
            callback(map);
        });
    };

    self.createMap = function(player, title) {
        var mapobj = self.getMap(title);
        if(mapobj) {
            player.msg('A map with that name already exists. Choose another.');
            return;
        }
        // create map
        var new_map = new Map({
            name: title,
            author: player.character.name,
            rooms: []
        });
        self.maps.push(new_map);
        // create first room
        var new_room = new Room({
            x: 0,
            y: 0,
            z: 0,
            type: 'grassTRBL'
        }, new_map);
        new_map.rooms.push(new_room);
        new_map.save();

        player.msg('Ok.');
    };

    self.init();
};

var Map = function(config, fn) {
    var self = this;
    
    // no-save
    self.filename;      // string
    
    // save
    self.name;          // string
    self.author;        // string
    self.rooms = [];    // array of objects (Room)
    
    self.init = function(config, fn) {
        self.filename = fn;
        self.name = config.name || 'Unknown Area';
        self.author = config.author || '';
        config.rooms.forEach(function(r){
            self.rooms.push(new Room(r, self));
        });
        console.log('[init] map loaded: ' + self.name);
    }
    
    self.stringify = function() {
        return JSON.stringify({
            name: self.name,
            author: self.author,
            rooms: self.roomStringify()
        }, null, '\t');
    }
    
    self.save = function() {
        fs.writeFileSync(data_path + self.name + '.json', self.stringify(), 'utf8');
    };

    self.roomStringify = function() {
        var stringify = [];
        self.rooms.forEach(function(r){
            stringify.push(r.getSaveData());
        });
        return stringify;
    }
    
    self.getRoom = function(x, y, z) {
        for(var i = 0; i < self.rooms.length; i++) {
            if(self.rooms[i].x == x && self.rooms[i].y == y && self.rooms[i].z == z) return self.rooms[i];
        }
        return false;
    };
    
    self.removeRoom = function(room) {
        var i = self.rooms.indexOf(room);
        self.rooms.splice(i, 1);
    };

    self.getMinimapData = function() {
        var roomdata = [];
         self.rooms.forEach(function(r){
             roomdata.push({x: r.x, y: r.y, z: r.z, terrain: r.type, env: r.environment});
         });
         return roomdata;
    };
    
    self.eachPlayer = function(callback) {
        self.rooms.forEach(function(room){
            room.eachPlayer(function(p){
                callback(p);
            })
        });
    };

    self.eachPlayerExcept = function(player, callback) {
        self.rooms.forEach(function(room){
            room.eachPlayer(function(p){
                if(p !== player) callback(p);
            })
        });
    };

    self.createRoom = function(player, dirargs) {
        var dir = dirargs.split(' ')[0];
        var args = dirargs.split(' ').splice(1);
        var x = player.character.location.x;
        var y = player.character.location.y;
        var z = player.character.location.z;
        switch(dir.substr(0, 1).toLowerCase()) {
            case 'n':
                y--;
                break;
            case 's':
                y++;
                break;
            case 'e':
                x++;
                break;
            case 'w':
                x--;
                break;
            case 'u':
                z++;
                break;
            case 'd':
                z--;
                break;
            default:
                player.msg('Invalid direction.');
                return;
        }
        if(player.character.room.map.getRoom(x, y, z)) {
            player.msg('Room already exists in that direction.');
            return;
        }
        var new_room = new Room({
            x: x,
            y: y,
            z: z,
            type: 'grass'
        }, self);
        self.rooms.push(new_room);
        self.save();
        player.msg('A new room has been created.');
        player.update({minimap: true, maplocnoanim: true});
        player.emit("sound", {sfx: 'create_room.wav', volume: 50});
        player.character.room.map.eachPlayerExcept(player, function(p){
            p.msg('Something about this area is different. Hmm..');
            p.update({minimap: true, maplocnoanim: true});
        });
        if(args.indexOf('-move') >= 0) {
            LOGIC.move(player, dir.substr(0, 1));
        }
    };

    self.destroyRoom = function(player, dirargs) {
        var dir = dirargs.split(' ')[0];
        var args = dirargs.split(' ').splice(1);
        var x = player.character.location.x;
        var y = player.character.location.y;
        var z = player.character.location.z;
        switch(dir.substr(0, 1).toLowerCase()) {
            case 'n':
                y--;
                break;
            case 's':
                y++;
                break;
            case 'e':
                x++;
                break;
            case 'w':
                x--;
                break;
            case 'u':
                z++;
                break;
            case 'd':
                z--;
                break;
            default:
                player.msg('Invalid direction.');
                return;
        }
        var destroy_room = player.character.room.map.getRoom(x, y, z);
        if(!destroy_room) {
            player.msg('There is no room in that direction.');
            return;
        }
        if(destroy_room.players.length > 0) {
            player.msg('There are players in the destruction room.');
            return;
        }
        self.removeRoom(destroy_room);
        self.save();
        player.msg('The room has been destroyed.');
        player.update({minimap: true});
        player.emit("sound", {sfx: 'destroy_room.mp3', volume: 50});
        player.character.room.map.eachPlayerExcept(player, function(p){
            p.msg('Something about this area is different. Hmm..');
            p.update({minimap: true});
        });
    };

    self.modifyRoom = function(player, modargs) {
        var id = modargs.split(' ')[0];
        var value = modargs.split(' ').splice(1).join(' ');
        if(id)
            id = matchcmd(id, new Array('name', 'description', 'terrain', 'environment'));
        var shouldSave = false;
        var shouldAnnounce = false;
        var shouldSendMap = false;
        var shouldSendMapToArea = false;
        var shouldOk = false;
        // boolean fix
        if(value=='true') value = true;
        if(value=='false') value = false;
        switch(id.toLowerCase()) {
            case 'name':
                player.character.room.name = value;
                shouldSave = true;
                shouldAnnounce = true;
                break;
            case 'description':
                player.character.room.desc = value;
                shouldSave = true;
                shouldAnnounce = true;
                break;
            case 'terrain':
                player.character.room.type = value;
                shouldSave = true;
                shouldAnnounce = true;
                shouldSendMapToArea = true;
                break;
            case 'environment':
                player.character.room.environment = value;
                shouldSave = true;
                shouldSendMapToArea = true;
                shouldAnnounce = true;
                break;
            case 'north':
                player.character.room.north = value;
                shouldSave = true;
                shouldOk = true;
                break;
            case 'south':
                player.character.room.south = value;
                shouldSave = true;
                shouldOk = true;
                break;
            case 'east':
                player.character.room.east = value;
                shouldSave = true;
                shouldOk = true;
                break;
            case 'west':
                player.character.room.west = value;
                shouldSave = true;
                shouldOk = true;
                break;
            case 'up':
                player.character.room.up = value;
                shouldSave = true;
                shouldOk = true;
                break;
            case 'down':
                player.character.room.down = value;
                shouldSave = true;
                shouldOk = true;
                break;
            default:
                player.msg(LOGIC._createTable(
                "Room Properties: " + player.character.location.map + ", " + player.character.location.x + ", " + player.character.location.y + ", " + player.character.location.z,
                [
                    {
                        property: "Name",
                        value: player.character.room.name
                    },
                    {
                        property: "Description",
                        value: player.character.room.desc
                    },
                    {
                        property: "Terrain",
                        value: player.character.room.type
                    },
                    {
                        property: "Environment",
                        value: player.character.room.environment
                    },
                    {
                        property: "North",
                        value: player.character.room.north
                    },
                    {
                        property: "South",
                        value: player.character.room.south
                    },
                    {
                        property: "East",
                        value: player.character.room.east
                    },
                    {
                        property: "West",
                        value: player.character.room.west
                    },
                    {
                        property: "Up",
                        value: player.character.room.up
                    },
                    {
                        property: "Down",
                        value: player.character.room.down
                    }
                ]));
        }
        if(shouldSave)
            player.character.room.map.save();
        if(shouldAnnounce) {
            player.character.room.eachPlayer(function(p){
                p.msg("The surroundings have changed.");
            });
        }
        if(shouldSendMap) {
            player.character.room.eachPlayer(function(p){
                p.update({minimap: true});
            });
        }
        if(shouldSendMapToArea) {
            player.character.room.map.eachPlayer(function(p){
                p.update({minimap: true});
            });
        }
        if(shouldOk)
            player.msg('Ok.');
    };

    self.init(config, fn);
};

var Room = function(config, mapobj) {
    var self = this;
    
    // no-save
    self.map;             // object (Map)
    self.players = [];    // array of objects (Player)
    self.mobs = [];       // array of objects (Mob)
    self.sayhistory = []; // array of objects (string)

    // save
    self.name;          // string
    self.desc;          // string
    self.x;             // int
    self.y;             // int
    self.z;             // int
    self.type;          // string
    self.environment;   // string (inside, outside, underground)
    self.north;         // string for linking
    self.south;         // string for linking
    self.east;          // string for linking
    self.west;          // string for linking
    self.up;            // string for linking
    self.down;          // string for linking

    self.init = function(config, mapobj) {
        self.map = mapobj;
        self.name = config.name || 'Untitled Room';
        self.desc = config.desc || 'This room has no description set.';
        self.x = config.x || 0;
        self.y = config.y || 0;
        self.z = config.z || 0;
        self.type = config.type || 'grass';
        self.environment = config.environment || 'outside';
        self.north = config.north || true;
        self.south = config.south || true;
        self.east = config.east || true;
        self.west = config.west || true;
        self.up = config.up || false;
        self.down = config.down || false;
    }
    
    self.getSaveData = function() {
        return {
            name: self.name,
            desc: self.desc,
            x: self.x,
            y: self.y,
            z: self.z,
            type: self.type,
            environment: self.environment,
            north: self.north,
            south: self.south,
            east: self.east,
            west: self.west,
            up: self.up,
            down: self.down
        };    
    }
    
    self.updateSaveHistory = function(say) {
        if(self.sayhistory.length > 50)
            self.sayhistory = self.sayhistory.splice(1);
        self.sayhistory.push(say);
    };

    self.addMob = function(mob) {
        self.mobs.push(mob);
    };
    
    self.removeMob = function(mob) {
        var i = self.mobs.indexOf(mob);
        self.mobs.splice(i, 1);
    };

    self.eachMob = function(callback) {
        self.mobs.forEach(function(p){
            callback(p);
        });
    };

    self.addPlayer = function(player) {
        self.players.push(player);
    };
    
    self.removePlayer = function(player) {
        var i = self.players.indexOf(player);
        self.players.splice(i, 1);
    };
    
    self.eachPlayer = function(callback) {
        self.players.forEach(function(p){
            callback(p);
        });
    };
    
    self.eachPlayerExcept = function(player, callback) {
        self.players.forEach(function(p){
            if(p !== player) callback(p);
        });
    };
    
    self.getPlayerListData = function() {
        var plist = [];
        // Note: Order is Last to First
        self.eachPlayer(function(player){
            plist.push({
                name: player.character.htmlname,
                picture: player.character.picture
            });
        });
        self.eachMob(function(mob){
            plist.push({
                name: mob.get('htmlname'),
                picture: ''
            });
        });
        return plist;
    };
    
    self.announce = function(data) {
        self.eachPlayer(function(p){
            p.msg(data);
        });
    };
    
    self.announceExcept = function(player, data) {
        self.eachPlayer(function(p){
            if(p !== player) p.msg(data);
        });
    };
    
    self.init(config, mapobj);
};

exports.World = World;
exports.Map = Map;
exports.Room = Room;