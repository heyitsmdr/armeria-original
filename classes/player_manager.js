var PlayerManager = function()
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
};

exports.PlayerManager = PlayerManager;