var Items = function(callback) {
    var self = this;
    self.objects = [];

    self.init = function(callback) {
        console.log('[init] loading item templates..');
        // clear objects
        self.objects = [];
        // load from db
        DB.items.find(function(err, itms){
            if(err) { console.log('ERROR: could not read items database.'); return; }
            itms.forEach(function(itm){
                self.objects.push(new Item(itm));
            });
            callback();
        });
    };

    self.getById = function(id) {
        for(var i = 0; i < self.objects.length; i++) {
            if(self.objects[i].id == id)
                return self.objects[i];
        }
        return false;
    };

    self.init(callback);
};

var Item = function(config) {
    var self = this;

    // saved
    self.id;
    self.name;
    self.htmlname;
    self.level;
    self.picture;
    self.rarity;

    self.init = function(config) {
        self.id = config.id;
        self.name = config.name;
        self.htmlname = config.htmlname;
        self.level = config.level;
        self.picture = config.picture;
        self.rarity = config.rarity;

        console.log('[init] item template loaded: ' + self.id);
    };

    self.save = function() {
        var data = {
            id: self.id,
            name: self.name,
            htmlname: self.htmlname,
            level: self.level,
            picture: self.picture,
            rarity: self.rarity
        };
        
        DB.items.update({id: self.id}, data, {upsert: true});
    };

    self.init(config);
};

exports.Items = Items;
exports.Item = Item;