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
    
    self.socket = socket;
};

exports.Player = Player;