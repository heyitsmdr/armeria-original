var Logic = function() {
    var self = this;
    
    self.say = function(player, what){
            player.socket.broadcast.emit('txt', {msg: player.character.htmlname + " says, '" + what + "'"});
            player.socket.emit('txt', {msg: "You say, '" + what + "'."});
    }
};

exports.Logic = Logic;