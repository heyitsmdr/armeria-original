var Players = function()
{
    var self = this;
    self.players = [];
    
    self.addPlayer = function(player) {
        self.players.push(player);
    }
    
    self.removePlayer = function(player) {
        var i = self.players.indexOf(player);
        self.players.splice(i, 1);
    }
    
    self.getPlayerCount = function() {
        return self.players.length;
    }
    
    self.each = function(callback) {
        self.players.forEach(function(p){
            callback(p);
        });
    }
    
    self.eachOnline = function(callback) {
        self.players.forEach(function(p){
            if(p.character.online) callback(p);
        });
    }

    self.eachOnlineExcept = function(player, callback) {
        self.players.forEach(function(p){
            if(p.character.online && player !== p) callback(p);
        });
    }

    self.eachOnlineInChannel = function(channel, callback) {
        self.players.forEach(function(p){
            if(p.character.online && p.character.channels.indexOf(channel) >= 0) callback(p);
        });
    }
    self.eachOnlineInChannelExcept = function(player, channel, callback) {
        self.players.forEach(function(p){
            if(p.character.online && player !== p && p.character.channels.indexOf(channel) >= 0) callback(p);
        });
    }
};

var Player = function(socket) {
    var self = this;
    
    self.character = false; // object
    self.socket = false;    // object
    
    /* Socket Emit (Type, Message) */
    self.emit = function(t, m) {
        socket.emit(t, m)
    }
    
    self.msg = function(m) {
        self.emit('txt', {msg: m});
    }
    
    self.update = function(what) {
        // Update Player List
        if(what.plist) {
            self.emit('plist', self.character.room.getPlayerListData());
        }
        // Update Map
        if(what.minimap) {
            self.emit('map', {data: self.character.room.map.getMinimapData(), name: self.character.room.map.name});
        }
        // Update Map Location
        if(what.maploc) {
            self.emit('maploc', {x: self.character.location.x, y: self.character.location.y, z: self.character.location.z});
        }
        // Update Map Location w/ No Animation (for redrawing minimap / moving up and down)
        if(what.maplocnoanim) {
            self.emit('maplocnoanim', {x: self.character.location.x, y: self.character.location.y, z: self.character.location.z});
        }
        // Update Inventory
        if(what.inventory) {
            self.emit('inv', self.character.getInventoryData());
        }
    }
    
    self.socket = socket;
};

exports.Player = Player;
exports.Players = Players;