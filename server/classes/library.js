var fs = require('fs');
var script_path = __dirname + '/../data/scripts/';

var Library = function(){
    var self = this;

    self.objects = [];

    self.init = function() {
        console.log('[init] loading library..');
        // clear objects
        self.objects = [];
        // load entire library from db
        DB.library.find(function(err, lib){
            if(err) { console.log('ERROR: could not read library database.'); return; }
            lib.forEach(function(libentry){
                self.objects.push(new LibraryEntry(libentry));
            });
        });
    }

    self.getById = function(id) {
        for(var i = 0; i < self.objects.length; i++) {
            if(self.objects[i].id == id)
                return self.objects[i];
        }
        return false;
    };

    self.save = function() {
        
    };

    self.addItem = function(player, parent) {

    };

    self.listType = function(player, args, type) {
        var objs = [];
        self.objects.forEach(function(lib){
            if(lib.type == type.toLowerCase())
                objs.push({ property: lib.id, value: lib.get('name') });
        });
        player.msg(LOGIC._createTable("Armeria Library: " + type + "s Directory", objs));
    };

    self.editEntry = function(player, args) {
        var id = getarg(args, 0, false);
        var prop = getarg(args, 1, false);
        var val = getarg(args, 2, true);
        // get object from library
        var obj = self.getById(id);
        if (obj === false) {
            player.msg('Entry not found in library.');
            return;
        }
        if(prop !== false && val !== false) {
            self.editEntryPropVal(player, obj, prop, val);
            return;
        }
        switch(obj.type) {
            case 'item':
                player.msg(LOGIC._createTable(
                "Item Properties: " + obj.id,
                [
                    {
                        property: "Name",
                        value: obj.get('name')
                    },
                    {
                        property: "HTMLName",
                        value: obj.get('htmlname').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    },
                    {
                        property: "Level",
                        value: obj.get('level')
                    }
                ]));
                break;
            case 'mob':
                player.msg(LOGIC._createTable(
                "Mob Properties: " + obj.id,
                [
                    {
                        property: "Name",
                        value: obj.get('name')
                    },
                    {
                        property: "HTMLName",
                        value: obj.get('htmlname').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                    },
                    {
                        property: "Level",
                        value: obj.get('level')
                    },
                    {
                        property: "Script",
                        value: obj.get('script')
                    }
                ]));
                break;
            default:
                player.msg('Cannot edit this type of entry.');
        }
    };

    self.editEntryPropVal = function(player, obj, prop, val){
        switch(obj.type) {
            case 'item':
                break;
            case 'mob':
                break;
        }
    };

    self.init();
};

var LibraryEntry = function(config) {
    var self = this;

    // basics
    self._id;
    self.id;
    self.parent;
    self.type;
    self.overrides;
    self.gameScript = false;

    self.init = function(config) {
        self._id = config._id;
        self.id = config.id;
        self.type = config.type;
        self.overrides = config.overrides;
        switch(self.type) {
            case 'item':
                self.parent = ITEMS.getById(config.parent);
                break;
            case 'mob':
                self.parent = MOBS.getById(config.parent);
                break;
            default:
                self.parent = config.parent;
        }
        // load a script?
        if(self.get('script')) {
            try {
                // write to temp data folder
                fs.writeFile(script_path + self._id + '.js', self.get('script'), function(err) {
                    self.gameScript = require(script_path + self._id + '.js').GameScript;
                    self.gameScript = new self.gameScript(self); 
                });
            } catch (err) {
                self.gameScript = false;
                console.log('[script] error loading: /data/scripts/' + self._id + '.js');
            }
        }
        console.log('[init] library ' + self.type + ' loaded: ' + self.id + ' (parent: ' + self.parent.id + ') level ' + self.get('level'));
    };

    self.get = function(stat) {
        return eval("self.overrides." + stat + " || self.parent." + stat);
    }

    /* ITEM ONLY FUNCTIONS */
    self.ttOutput = function() {
        return "<span class='itemtooltip' data-id='" + self.id + "'>" + self.get('htmlname') + "</span>";
    };
    /* END: ITEM ONLY FUNCTIONS */

    /* SCRIPT FUNCTIONS */
    self.emit = function(func) {
        if(!self.gameScript) return;
        var args = new Array();
        if(arguments.length > 1) {
        	for(var i = 1; i < arguments.length; i++) {
        		args.push(arguments[i]);
        	}
        }
        try {
            eval("self.gameScript." + func)(args);
        } catch(err) {
            // error in game script
            if(LIVE) {
                hipchatmsg('<b>Exception in Script for:</b> ' + self.id, 'red');
                hipchatmsg(JSON.stringify(err), 'red');
            } else {
                console.log('SCRIPT ERROR: ' + self.id);
                console.log(err);
            }
        }
    };
    self.say = function(location, text) {
        var map = WORLD.getMap(location.map);
        if(!map) return;
        var room = map.getRoom(location.x, location.y, location.z);
        if(!room) return;
        room.eachPlayer(function(p){
            p.msg(self.get('htmlname') + " says, '" + text + "'");
        });
    };
    /* END: SCRIPT FUNCTIONS */

    self.stringify = function() {
        return JSON.stringify({
            id: self.id,
            parent: self.parent,
            type: self.type,
            overrides: self.overrides
        }, null, '\t');
    }

    self.init(config);
};
exports.Library = Library;