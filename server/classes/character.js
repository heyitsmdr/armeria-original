/*jslint plusplus: true, continue: true, nomen: true*/
/*global console: false, require: false, __dirname: false, Character: false, WORLD: false, PLAYERS: false, LIVE: false, hipchatmsg: false, LOGIC: false, LIBRARY: false, exports: false*/
var Characters = function () {
    "use strict";
    var self = this;
    self.objects = [];
    
    self.init = function () {
        console.log('[init] loading characters..');
        // clear objects
        self.objects = [];
        // load from db
        DB.characters.find(function(err, chars){
            if(err) { console.log('ERROR: could not read characters database.'); return; }
            chars.forEach(function(char){
                self.objects.push(new Character(char));
            });
        });
    };
    
    self.create = function (charid, charname) {
        if (self.getCharacterById(charid)) { return false; }
        var char = new Character({
            id: charid,
            name: charname,
            location: {
                map: 'Test Area',
                x: 1,
                y: 0,
                z: 0
            },
            privs: []
        });
        self.objects.push(char);
        char.save();
        return char;
    };
    
    self.getCharacterById = function (id) {
        var i;
        for (i = 0; i < self.objects.length; i++) {
            if (self.objects[i].id == id) { return self.objects[i]; }
        }
        return false;
    };
    
    self.getCharacterByName = function (name, isonline, checknicks) {
        var i;
        for (i = 0; i < self.objects.length; i++) {
            if ((self.objects[i].name.toLowerCase() === name.toLowerCase()) || (checknicks === true && self.objects[i].nickname.toLowerCase() === name.toLowerCase())) {
                if (isonline) {
                    if (self.objects[i].online) {
                        return self.objects[i];
                    } else {
                        return false;
                    }
                } else {
                    return self.objects[i];
                }
            }
        }
        return false;
    };
    
    self.init();
};

var Character = function (config) {
    "use strict";
    var self = this;
    
    // saved
    self.id = 0;          // int
    self.name = '';       // string
    self.htmlname = '';   // string
    self.location = {};   // array (map, x, y, z)
    self.picture = '';    // string
    self.builder = true;  // boolean
    self.channels = [];   // array of strings
    self.roomdesc = '';   // string
    self.gender = '';     // string
    self.race = '';       // string
    self.characterClass = '';     // string
    self.stats = {};      // array (health maxhealth magic maxmagic energy maxenergy str int cha armor resistance)
    self.statmods = {};   // array (strmod intmod chamod pdmgmod mdmgmod resistancemod)
    self.level = 1;       // int
    self.age = 0;         // int
    self.inventory = [];  // array of strings
    self.equipment = {};  // equipment for each slot
    self.title = '';      // string
    self.privs = [];      // array of strings
    self.scriptvars = []; // array of script variables

    // not saved
    self.online = false;    // boolean
    self.player = '';       // object (Player)
    self.room = '';         // object (Room)
    self.replyto = '';      // string
    self.nickname = '';     // string
    self.regen = false;     // function (self.handleRegen())
    self.blockMovement = false; // boolean -- block movement (mostly used by scripts)

    self.init = function (config) {
        self.id = config.id || 0;
        self.name = config.name || 'Someone';
        self.htmlname = config.htmlname || "<span class='yellow'>" + self.name + "</span>";
        self.location = config.location || {map: 'Test Area', x: 1, y: 0, z: 0};
        self.picture = config.picture || '';
        self.builder = config.builder || true;
        self.channels = config.channels || [];
        self.roomdesc = config.roomdesc || 'is here.';
        self.gender = config.gender || 'male';
        self.race = config.race || 'Human';
        self.characterClass = config.characterClass || 'Novice';
        self.stats = config.stats || {health: 100, maxhealth: 100, magic: 100, maxmagic: 100, energy: 100, maxenergy: 100, exp: 0, exptl: 200, str: 10, int: 10, cha: 10, pdmg: 10, mdmg: 10, armor: 10, resistance: 10};
        self.statmods = config.statmods || {strmod: 0, intmod: 0, chamod: 0, pdmgmod: 0, mdmgmod: 0, resistancemod: 0};
        self.level = config.level || 1;
        self.age = config.age || 18;
        self.inventory = config.inventory || [];
        self.equipment = config.equipment || {weapon: '', body: '', feet: ''};
        self.title = config.title || '';
        self.privs = config.privs || [];
        self.scriptvars = config.scriptvars || [];

        console.log('[init] character loaded: ' + self.name);
    };
    
    self.save = function () {
        var data = {
            id: self.id,
            name: self.name,
            htmlname: self.htmlname,
            location: self.location,
            picture: self.picture,
            builder: self.builder,
            channels: self.channels,
            roomdesc: self.roomdesc,
            gender: self.gender,
            race: self.race,
            characterClass: self.characterClass,
            stats: self.stats,
            statmods: self.statmods,
            level: self.level,
            age: self.age,
            inventory: self.inventory,
            equipment: self.equipment,
            title: self.title,
            privs: self.privs,
            scriptvars: self.scriptvars
        };
        
        DB.characters.update({id: self.id}, data, {upsert: true});
    };
    
    self.getMapObj = function () {
        return WORLD.getMap(self.location.map);
    };
    
    self.getRoomObj = function () {
        return self.getMapObj().getRoom(self.location.x, self.location.y, self.location.z);
    };
    
    self.locationString = function () {
        return self.location.map + ', ' + self.location.x + ', ' + self.location.y + ', ' + self.location.z;
    };

    self.hasPriv = function (priv) {
        if (self.privs.indexOf(priv) >= 0) {
            return true;
        } else {
            return false;
        }
    };

    self.login = function () {
        // set online
        self.online = true;
        // store room
        self.room = self.getRoomObj();
        if (self.room === false) {
            self.player.msg('Your character is saved to a room that no longer exists. Please contact us. Disconnecting..');
            self.online = false;
            self.player.socket.disconnect();
            return;
        }
        // add player to room
        self.room.addPlayer(self.player);
        // update players (including yourself)
        self.room.eachPlayer(function (p) {
            p.update({plist: 1});
        });
        // send notifications to everyone
        PLAYERS.eachOnlineExcept(self.player, function (p) {
            p.emit('notify', {
                title: self.name + ' logged in!',
                text: 'This character has logged in to the world of Armeria. They are located at ' + self.room.name + '.',
                image: self.picture
            });
        });
        // update local player
        self.player.update({minimap: 1, maplocnoanim: 1, inventory: 1, equipment: 1, bars: 1});
        // announce to room
        self.room.announceExcept(self.player, self.htmlname + " has just logged in to Armeria!");
        // announce to hipchat (on live server)
        if (LIVE) { hipchatmsg(self.name + ' has just logged in!', 'green'); }
        // priviledged character?
        if (self.privs.length >= 1) {
            self.player.msg("<div style='padding:10px;width:50%;margin-top:10px;border:2px solid #540303;background-color:#2b0505;color:#BA3C3C;box-sizing:border-box'>You are using a priviledged character. You have abilities that other characters do not possess. Do NOT use any of these abilities to help other characters in the game in ANY WAY.<br><br>Your character has been granted the following permissions: " + self.privs.join(', ') + ".</div>");
        }
        // Emit to Mobs
        self.room.eachMob(function(mob){
            mob.obj.emit('onRoomEnter', self.player);
            mob.obj.emit('onLogin', self.player);
        });
        // look around
        LOGIC.look(self.player);
        // set up timers
        self.regen = setInterval(self.handleRegen, 30000);
    };
    
    self.logout = function () {
        // stop timers
        clearInterval(self.regen);
        self.regen = false;
        // announce to room
        self.room.announce(self.htmlname + " has just logged out of Armeria!");
        // announce to hipchat (on live server)
        if (LIVE) { hipchatmsg(self.name + ' has just logged out.', 'green'); }
        // remove player from room
        self.room.removePlayer(self.player);
        // update players
        self.room.eachPlayer(function (p) {
            p.update({plist: 1});
        });
        // set offline
        self.online = false;
        // save
        self.save();
    };
    
    self.switchRooms = function (m, x, y, z) {
        var map, room, old_room;
        map = WORLD.getMap(m);
        if (!map) { return false; }
        room = map.getRoom(x, y, z);
        if (!room) { return false; }
        
        old_room = self.room;
        
        old_room.removePlayer(self.player);
        room.addPlayer(self.player);
        
        self.room = room;
        self.location.map = map.name;
        self.location.x = x;
        self.location.y = y;
        self.location.z = z;
        
        // update players in old room
        old_room.eachPlayer(function (p) {
            p.update({plist: 1});
        });
        
        // update players in new room
        room.eachPlayer(function (p) {
            p.update({plist: 1});
        });
        
        // update local player
        if (map === old_room.map && old_room.z !== z) {
            self.player.update({maplocnoanim: 1});
        } else if (map === old_room.map) {
            self.player.update({maploc: 1});
        } else {
            self.player.update({minimap: 1, maplocnoanim: 1});
        }

        return true;
    };

	self.addInventoryItem = function (item) {
		var obj = false;
        if(typeof(item) == 'string')
            obj = LIBRARY.getById(item);
        else if(typeof(item) == 'object')
            obj = item;

		if (!obj) { return false; }
		if (obj.type !== 'item') { return false; }
			
		self.inventory.push(obj.id);

        self.player.update({inventory: 1});
        
        return obj;
	};
	
    // item (String or Object[LibraryItem])
    self.removeInventoryItem = function (item) {
        var obj = false;
        if(typeof(item) == 'string')
            obj = LIBRARY.getById(itemId);
        else if(typeof(item) == 'object')
            obj = item;

        if (!obj) { return false; }
        if (obj.type !== 'item') { return false; }
            
        var inventoryIndex = self.inventory.indexOf(obj.id);
        if(inventoryIndex == -1) { return false; }

        self.inventory.splice(inventoryIndex, 1);

        self.player.update({inventory: 1});

        return obj;
    };

    self.eachInventoryItem = function (callback) {
        self.inventory.forEach(function (item) {
            var libobj = LIBRARY.getById(item);
            if (libobj !== false) { callback(libobj); }
        });
    };

    self.eachEquippedItem = function(callback) {
        var iid;
        iid = LIBRARY.getById(self.equipment.weapon);
        if(iid)
            callback(iid);
        iid = LIBRARY.getById(self.equipment.body);
        if(iid)
            callback(iid);
        iid = LIBRARY.getById(self.equipment.feet);
        if(iid)
            callback(iid);
    };

    self.getInventoryData = function() {
        var items = [];
        self.eachInventoryItem(function(i) {
            items.push({
                uid: i.uid,
                id: i.id,
                name: i.get('name'),
                htmlname: i.get('htmlname'),
                rarity: i.get('rarity'),
                picture: ((i.get('picture'))?i.get('picture').replace(' ', ''):'')
            });
        });
        return items;
    };
    
    self.getEquipmentData = function() {
        var items = [];
        self.eachEquippedItem(function(i){
            items.push({
                uid: i.uid,
                id: i.id,
                name: i.get('name'),
                htmlname: i.get('htmlname'),
                rarity: i.get('rarity'),
                picture: ((i.get('picture'))?i.get('picture').replace(' ', ''):''),
                equipslot: i.get('equipslot')
            });
        });
        return items;
    };

    self.getInventoryItem = function(data) {
        var obj = false;
        self.eachInventoryItem(function(i) {
            if(i.get('name').toLowerCase().indexOf(data.toLowerCase()) > -1)
                obj = i;
        });
        return obj;
    }

    self.getEquippedItem = function(data) {
        var obj = false;
        self.eachEquippedItem(function(i){
            if(i.get('name').toLowerCase().indexOf(data.toLowerCase()) > -1)
                obj = i;
        });
        return obj;
    };

    self.addEquipment = function(equipType, item) {
        var obj = false;
        if(typeof(item) == 'string')
            obj = LIBRARY.getById(itemId);
        else if(typeof(item) == 'object')
            obj = item;

        if (!obj) { return false; }

        switch(equipType) {
            case 'weapon':
                self.equipment.weapon = obj.id;
                break;
            case 'body':
                self.equipment.body = obj.id;
                break;
            case 'feet':
                self.equipment.feet = obj.id;
                break;
            default:
                return false;
        }

        self.player.update({equipment: 1});

        return true;
    };

    self.removeEquipment = function(equipType, item) {
        var obj = false;
        if(typeof(item) == 'string')
            obj = LIBRARY.getById(itemId);
        else if(typeof(item) == 'object')
            obj = item;

        if (!obj) { return false; }

        switch(equipType) {
            case 'weapon':
                self.equipment.weapon = '';
                break;
            case 'body':
                self.equipment.body = '';
                break;
            case 'feet':
                self.equipment.feet = '';
                break;
            default:
                return false;
        }

        self.player.update({equipment: 1});

        return true;
    };

    self.getBarData = function(data) {
        return {
            health: { current: self.stats.health, max: self.stats.maxhealth },
            magic: { current: self.stats.magic, max: self.stats.maxmagic },
            energy: { current: self.stats.energy, max: self.stats.maxenergy }
        }
    };

    self.handleRegen = function() {
        var healthint = ((self.stats.health == self.stats.maxhealth) ? false : Math.round(self.stats.maxhealth) * 0.2);
        var magicint = ((self.stats.magic == self.stats.maxmagic) ? false : Math.round(self.stats.maxmagic) * 0.2);
        var energyint = ((self.stats.energy == self.stats.maxenergy) ? false : Math.round(self.stats.maxenergy) * 0.2);

        if(healthint)
            self.stats.health = (self.stats.health + healthint > self.stats.maxhealth) ? self.stats.maxhealth : self.stats.health + healthint;
        if(magicint)
            self.stats.magic = (self.stats.magic + magicint > self.stats.maxmagic) ? self.stats.maxmagic : self.stats.magic + magicint;
        if(energyint)
            self.stats.energy = (self.stats.energy + energyint > self.stats.maxenergy) ? self.stats.maxenergy : self.stats.energy + energyint;

        // update you
        self.player.update({bars: 1});

        // update room
        self.player.character.room.eachPlayer(function(p) {
            p.update({plisthealth: 1});
        });
    };

    self.init(config);
};

exports.Character = Character;
exports.Characters = Characters;