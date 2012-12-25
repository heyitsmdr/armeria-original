var fs        = require('fs');
var data_path = __dirname + '/../data/characters/';

var Characters = function() {
    var self = this;
    self.objects = [];
    
    self.init = function() {
        console.log('[init] loading characters..');
        // clear objects
        self.objects = [];
        fs.readdir(data_path, function(err, files){
            // load all characters
            for(i in files) {
                var character_file = data_path + files[i];
                if(!fs.statSync(character_file).isFile()) {
                    console.log('[init] error: invalid character file (' + character_file + '), moving on..');
                    continue;
                }
                self.objects.push(new Character(JSON.parse(fs.readFileSync(character_file).toString('utf8'))));
            }
        });
    }
    
    self.create = function(charid, charname) {
        if(self.getCharacterById(charid)) return false;
        var char = new Character({
            id: charid,
            name: charname,
            location: {
                map: 'Test Area',
                x: 0,
                y: 0,
                z: 0
            }
        });
        self.objects.push(char);
        char.save();
        return char;
    }
    
    self.getCharacterById = function(id) {
        for(var i = 0; i < self.objects.length; i++) {
            if(self.objects[i].id==id) return self.objects[i];
        }
        return false;
    }
    
    self.getCharacterByName = function(name, isonline) {
        for(var i = 0; i < self.objects.length; i++) {
            if(self.objects[i].name.toLowerCase() == name.toLowerCase()) {
                if(isonline) {
                    if(self.objects[i].online)
                        return self.objects[i];
                    else
                        return false;
                } else {
                    return self.objects[i];
                }
            }
        }
        return false;
    }
    
    self.init();
};

var Character = function(config) {
    var self = this;
    
    // saved
    self.id;        // int
    self.name;      // string
    self.htmlname;  // string
    self.location;  // array (map, x, y, z)
    self.picture;   // string
    self.builder;   // boolean
    self.channels;  // array of strings
    self.roomdesc;  // string
    self.stats;     // array (health, maxhealth, str, agi, sta, int)
    self.level;


    // not saved
    self.online = false;    // boolean
    self.player;            // object (Player)
    self.room;              // object (Room)
    self.replyto;           // string
    
    self.init = function(config) {
        self.id = config.id || 0;
        self.name = config.name || 'Someone';
        self.htmlname = config.htmlname || "<span class='yellow'>" + self.name + "</span>";
        self.location = config.location || {map: 'somemap', x: 0, y: 0, z: 0};
        self.picture = config.picture || '';
        self.builder = config.builder || false;
        self.channels = config.channels || [];
        self.roomdesc = config.roomdesc || 'is here.';
        self.stats = config.stats || {health: 100, maxhealth: 100, str: 30, agi: 30, sta: 30, int: 30};
        self.level = config.level || 1;
    }
    
    self.stringify = function() {
        return JSON.stringify({
            id: self.id,
            name: self.name,
            htmlname: self.htmlname,
            location: self.location,
            picture: self.picture,
            builder: self.builder,
            channels: self.channels,
            roomdesc: self.roomdesc,
            stats: self.stats,
            level: self.level
        }, null, '\t');    
    }
    
    self.save = function() {
        fs.writeFileSync(data_path + self.id + '.json', self.stringify(), 'utf8');
    }
    
    self.getMapObj = function() {
        return WORLD.getMap(self.location.map);
    }
    
    self.getRoomObj = function() {
        return self.getMapObj().getRoom(self.location.x, self.location.y, self.location.z);
    }
    
    self.login = function() {
        // set online
        self.online = true;
        // store room
        self.room = self.getRoomObj();
        // add player to room
        self.room.addPlayer(self.player);
        // update players (including yourself)
        self.room.eachPlayer(function(p){
            p.update({plist: 1});
        });
        // send notifications to everyone
        PLAYERS.eachOnlineExcept(self.player, function(p){
            p.emit('notify', {
                title: self.name + ' logged in!',
                text: 'This character has logged in to the world of Armeria. They are located at ' + self.room.name + '.',
                image: self.picture
            });
        });
        // update local player
        self.player.update({minimap: 1, maploc: 1});
        // announce to room
        self.room.announceExcept(self.player, self.htmlname + " has just logged in to Armeria!");
    }
    
    self.logout = function() {
        // announce to room
        self.room.announce(self.htmlname + " has just logged out of Armeria!");
        // remove player from room
        self.room.removePlayer(self.player);
        // update players
        self.room.eachPlayer(function(p){
            p.update({plist: 1});
        });
        // set offline
        self.online = false;
        // save
        self.save();
    }
    
    self.switchRooms = function(m, x, y, z) {
        var map = WORLD.getMap(m);
        if(!map) return false;
        var room = map.getRoom(x, y, z);
        if(!room) return false;
        
        var old_room = self.room;
        
        old_room.removePlayer(self.player);
        room.addPlayer(self.player);
        
        self.room = room;
        self.location.map = map.name;
        self.location.x = x;
        self.location.y = y;
        self.location.z = z;
        
        // update players in old room
        old_room.eachPlayer(function(p){
            p.update({plist: 1});
        });
        
        // update players in new room
        room.eachPlayer(function(p){
            p.update({plist: 1});
        });
        
        // update local player
        if(map == old_room.map && old_room.z != z)
            self.player.update({maplocnoanim: 1});
        else if(map == old_room.map)
            self.player.update({maploc: 1});
        else
            self.player.update({minimap: 1, maplocnoanim: 1});

        return true;
    }
    
    self.init(config);
};

exports.Character = Character;
exports.Characters = Characters;