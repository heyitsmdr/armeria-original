var fs        = require('fs');
var data_path = __dirname + '/../data/maps';

var World = function() {
    var self = this;
    
    self.maps = [];     // array of objects (Map)
    
    self.init = function() {
        server_log('init', 'loading world..');
        self.maps = [];
        fs.readdir(data_path, function (err, files) {
            // load all maps
            for(i in files) {
                var map_file = data_path + files[i];
                if(!fs.statSync(map_file).isFile()) {
                    server_log('init', 'error: invalid map file (' + map_file + ')');
                    continue;
                }
                self.maps.push(new Map(JSON.parse(fs.readFileSync(map_file).toString('utf8')), files[i]));
            }
        });
    }
    
    self.init();
};

var Map = function(config, fn) {
    var self = this;
    
    // no-save
    self.filename;      // string
    
    // save
    self.name;          // string
    self.author;        // string
    self.rooms = [];    // array of objects (Room)
    
    self.init = function(config, fn) {
        self.filename = fn;
        self.name = config.name || 'Unknown Area';
        self.author = config.author || '';
        config.rooms.forEach(function(r){
            self.rooms.push(new Room(r, self));
        });
        server_log('init', 'map loaded: ' + self.name);
    }
    
    self.stringify = function() {
        return JSON.stringify({
            name: self.name,
            author: self.author,
            rooms: self.roomStringify()
        }, null, '\t');
    }
    
    self.roomStringify = function() {
        var stringify = [];
        self.rooms.forEach(function(r){
            stringify.push(r.getSaveData());
        });
        return stringify;
    }
    
    self.init(config, fn);
};

var Room = function(config, mapobj) {
    var self = this;
    
    // no-save
    self.map;           // object (Map)
    self.players = [];  // array of objects (Player)
    
    // save
    self.name;          // string
    self.desc;          // string
    self.x;             // int
    self.y;             // int
    self.z;             // int
    
    self.init = function(config, mapobj) {
        self.map = mapobj;
        self.name = config.name || 'Untitled Room';
        self.desc = config.desc || 'This room has no description set.';
        self.x = config.x || 0;
        self.y = config.y || 0;
        self.z = config.z || 0;
    }
    
    self.getSaveData = function() {
        return {
            name: self.name,
            desc: self.desc,
            x: self.x,
            y: self.y,
            z: self.z
        };    
    }
    
    self.init(config, mapobj);
};

exports.World = World;
exports.Map = Map;
exports.Room = Room;