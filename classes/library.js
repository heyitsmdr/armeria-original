var fs        = require('fs');
var data_path = __dirname + '/../data/library.json';

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

    self.init();
};

var LibraryEntry = function(config) {
    var self = this;

    // basics
    self.id;
    self.parent;
    self.type;
    self.overrides;

    self.init = function(config) {
        self.id = config.id;
        self.type = config.type;
        switch(self.type) {
            case 'item':
                self.parent = ITEMS.getById(config.parent);
                break;
            default:
                self.parent = config.parent;
        }
        self.overrides = config.overrides;
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