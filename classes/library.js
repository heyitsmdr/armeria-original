var fs          = require('fs');
var data_path   = __dirname + '/../data/library.json';
var script_path = __dirname + '/../data/scripts/';

var Library = function(){
    var self = this;

    self.objects = [];

    self.init = function() {
        console.log('[init] loading library..');
        // clear objects
        self.objects = [];
        // load entire library
        var lib = JSON.parse(fs.readFileSync(data_path).toString('utf8'));
        lib.forEach(function(entry){
            // is there already an entry for this?
            if(self.getById(entry.id) !== false)
                console.log('[init] library ' + entry.type + ' failed to load: ' + entry.id + ' (duplicate id)');
            else
                self.objects.push(new LibraryEntry(entry));
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

    self.init();
};

var LibraryEntry = function(config) {
    var self = this;

    // basics
    self.id;
    self.parent;
    self.type;
    self.overrides;
    self.gameScript = false;

    self.init = function(config) {
        self.id = config.id;
        self.type = config.type;
        self.overrides = config.overrides;
        switch(self.type) {
            case 'item':
                self.parent = ITEMS.getById(config.parent);
                break;
            case 'mob':
                self.parent = MOBS.getById(config.parent);
                // load a script?
                if(self.get('script')) {
                    self.gameScript = require(script_path + self.get('script')).GameScript;
                    self.gameScript = new self.gameScript(self);
                }
                break;
            default:
                self.parent = config.parent;
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
    self.emit = function(func, arg1, arg2, arg3, arg4) {
        if(!self.gameScript) return;
        switch(func) {
            case 'onSay':
                self.gameScript.onSay(arg1, arg2);
                break;
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