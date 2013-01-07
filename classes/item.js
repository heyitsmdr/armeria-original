var fs        = require('fs');
var data_path = __dirname + '/../data/items/';

var Items = function(callback) {
    var self = this;
    self.objects = [];

    self.init = function(callback) {
        console.log('[init] loading item templates..');
        // clear objects
        self.objects = [];
        fs.readdir(data_path, function(err, files){
            // load all items
            for(i in files) {
                var item_file = data_path + files[i];
                if(!fs.statSync(item_file).isFile()) {
                    console.log('[init] error: invalid item template file (' + item_file + '), moving on..');
                    continue;
                }
                self.objects.push(new Item(JSON.parse(fs.readFileSync(item_file).toString('utf8'))));
            }
            callback();
        });
    }

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

    self.init = function(config) {
        self.id = config.id;
        self.name = config.name;
        self.htmlname = config.htmlname;
        self.level = config.level;
        console.log('[init] item template loaded: ' + self.id);
    };

    self.stringify = function() {
        return JSON.stringify({
            id: self.id,
            name: self.name,
            htmlname: self.htmlname,
            level: self.level
        }, null, '\t');
    }

    self.save = function() {
        fs.writeFileSync(data_path + self.id + '.json', self.stringify(), 'utf8');
    }

    self.init(config);
};

exports.Items = Items;
exports.Item = Item;