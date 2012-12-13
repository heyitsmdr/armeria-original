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
        var char = new Character({id: charid, name: charname});
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
    
    self.init();
};

var Character = function(config) {
    var self = this;
    
    // saved
    self.id;        // int
    self.name;      // string
    self.htmlname;  // string
    self.location;  // array (map, x, y, z)
    
    // not saved
    self.online = false;    // boolean
    self.player;            // object (Player)
    
    self.init = function(config) {
        self.id = config.id || 0;
        self.name = config.name || 'Someone';
        self.htmlname = config.htmlname || "<span class='yellow'>" + self.name + "</span>";
        self.location = config.location || {map: 'somemap', x: 0, y: 0, z: 0};
    }
    
    self.stringify = function() {
        return JSON.stringify({
            id: self.id,
            name: self.name,
            htmlname: self.htmlname,
            location: self.location
        }, null, '\t');    
    }
    
    self.save = function() {
        fs.writeFileSync(data_path + self.id + '.json', self.stringify(), 'utf8');
    }
    
    self.init(config);
};

exports.Character = Character;
exports.Characters = Characters;