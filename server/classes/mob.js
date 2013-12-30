var Mobs = function(callback) {
    var self = this;
    self.objects = [];

    self.init = function(callback) {
        console.log('[init] loading mob templates..');
        // clear objects
        self.objects = [];
        // load from db
        DB.mobs.find(function(err, mobiles){
            if(err) { console.log('ERROR: could not read mobile database.'); return; }
            mobiles.forEach(function(mobile){
                self.objects.push(new Mob(mobile));
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

var Mob = function(config) {
    var self = this;

    // saved
    self.id;
    self.name;
    self.htmlname;
    self.level;
    self.script;
    self.title;

    self.init = function(config) {
        self.id = config.id;
        self.name = config.name;
        self.htmlname = config.htmlname;
        self.level = config.level;
        self.script = config.script;
        self.title = config.title;
        console.log('[init] mob template loaded: ' + self.id);
    };

    self.save = function() {
        var data = {
            id: self.id,
            name: self.name,
            htmlname: self.htmlname,
            level: self.level,
            script: self.script,
            title: self.title
        };
        
        DB.mobs.update({id: self.id}, data, {upsert: true});
    };

    self.init(config);
};

exports.Mobs = Mobs;
exports.Mob = Mob;