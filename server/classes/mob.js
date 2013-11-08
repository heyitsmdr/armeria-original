var fs        = require('fs');
var data_path = __dirname + '/../data/mobs/';

var Mobs = function(callback) {
    var self = this;
    self.objects = [];

    self.init = function(callback) {
        console.log('[init] loading mob templates..');
        // clear objects
        self.objects = [];
        fs.readdir(data_path, function(err, files){
            // load all items
            for(i in files) {
                var mob_file = data_path + files[i];
                if(!fs.statSync(mob_file).isFile()) {
                    console.log('[init] error: invalid mob template file (' + mob_file + '), moving on..');
                    continue;
                }
                self.objects.push(new Mob(JSON.parse(fs.readFileSync(mob_file).toString('utf8'))));
            }
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

    self.stringify = function() {
        return JSON.stringify({
            id: self.id,
            name: self.name,
            htmlname: self.htmlname,
            level: self.level,
            script: self.script,
            title: self.title
        }, null, '\t');
    }

    self.save = function() {
        fs.writeFileSync(data_path + self.id + '.json', self.stringify(), 'utf8');
    };

    self.init(config);
};

exports.Mobs = Mobs;
exports.Mob = Mob;