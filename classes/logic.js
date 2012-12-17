var Logic = function() {
    var self = this;
    
    self.say = function(player, what) {
        if(what.length == 0) self.look(player);
        if(what === "lol") { self.lol(player); return; }
        
        //Customize output depending on sentence punctuation.
        var isQuestion = false;
        var isExcited = false;
        var msgStart = " says, '";
        var msgStart_self = "You say, '";
        if (what.substr(what.length - 1, 1) === '?' || what.substr(what.length - 2, 1) === '?') { isQuestion = true; }
        if (what.substr(what.length - 1, 1) === '!' || what.substr(what.length - 2, 1) === '!') { isExcited = true; }
        if (isQuestion) {
            msgStart = " asks, '";
            msgStart_self = "You ask, '";
            if (isExcited) {
                var r = Math.floor(Math.random()*3)
                switch(r){
                    case 0 :
                        msgStart = " asks excitedly, '"
                        msgStart_self = "You ask excitedly, '"
                        break;
                    case 1 :
                        msgStart = " asks loudly, '"
                        msgStart_self = "You ask loudly, '"
                        break;
                    case 2 :
                        msgStart = " asks uncontrollably, '"
                        msgStart_self = "You ask uncontrollably, '"
                        break;
                }
            }
        } else if (isExcited) {
            msgStart = " exclaims, '";
            msgStart_self = "You exclaim, '"
        }
            player.character.room.eachPlayerExcept(player, function(p){
                p.msg(player.character.htmlname + msgStart + what + "'");
            });
            player.msg(msgStart_self + what + "'");
    }
    
    self.move = function(player, dir) {
        var x = player.character.location.x;
        var y = player.character.location.y;
        var z = player.character.location.z;
        var map = player.character.location.map;
        var dir_exit;
        var dir_enter;
        var dir_you;
        var msg_old = '%n walked %d.';
        var msg_new = '%n arrived from the %d.';
        var msg_self = 'You walked %d.';

        // calculate new x,y,z
        switch(dir.toLowerCase()) {
            case 'n':
                y -= 1;
                dir_exit = 'north';
                dir_enter = 'south';
                dir_you = 'north';
                break;
            case 's':
                y += 1;
                dir_exit = 'south';
                dir_enter = 'north';
                dir_you = 'south';
                break;
            case 'e':
                x += 1;
                dir_exit = 'east';
                dir_enter = 'west';
                dir_you = 'east';
                break;
            case 'w':
                x -= 1;
                dir_exit = 'west';
                dir_enter = 'east';
                dir_you = 'west';
                break;
            case 'u':
                z += 1;
                dir_exit = 'up';
                dir_enter = 'below';
                dir_you = 'up';
                break;
            case 'd':
                z -=1;
                dir_exit = 'down';
                dir_enter = 'above';
                dir_you = 'down';
                break;
            default:
                player.emit("mapnomove", true);
                return;
        }
        
        // attempt to get new room
        var old_room = player.character.room;
        var new_room = player.character.room.map.getRoom(x, y, z);
        if(!new_room) {
            player.emit("mapnomove", true);
            return;
        }
        
        // messages
        msg_old = msg_old.replace('%n', player.character.htmlname);
        msg_old = msg_old.replace('%d', dir_exit);
        msg_new = msg_new.replace('%n', player.character.htmlname);
        msg_new = msg_new.replace('%d', dir_enter);
        msg_self = msg_self.replace('%n', player.character.htmlname);
        msg_self = msg_self.replace('%d', dir_you);
        
        if(player.character.switchRooms(map, x, y, z)) {
            old_room.eachPlayer(function(p){
                p.msg(msg_old);
            });
            new_room.eachPlayerExcept(player, function(p){
                p.msg(msg_new);
            });
            player.msg(msg_self);
            self.look(player);
            player.emit("sound", {sfx: 'walk_grass_1.mp3', volume: 25});
        }
    }
    
    self.look = function(player) {
        player.msg('<br/><span class="yellow">' + player.character.room.name + '</span><br/>' + player.character.room.desc);
        player.character.room.eachPlayerExcept(player, function(p){
                player.msg(p.character.htmlname + ' is here.');
            });
    }
    
    self.whisper = function(player, args) {
        var who = args.split(' ')[0];
        var what = args.split(' ').splice(1).join(' ');
        
        who = who.replace('.', ' ');
        
        var target = CHARACTERS.getCharacterByName(who, true);
        if(target) {
            player.msg("<span class='purple'>You whisper to " + target.htmlname + ", '" + what + "'</span>");
            target.player.msg("<span class='purple'>" + player.character.htmlname + " whispers, '" + what + "'</span>");
            target.player.emit("sound", {sfx: 'whisper.wav', volume: 25});
            target.player.character.replyto = player.character.name.replace(' ', '.');
        } else {
            player.msg("No character found with that name.");
        }
    }
    
    self.reply = function(player, what) {
        if(!player.character.replyto) {
            player.msg("Noone has sent you a whisper yet.");
            return;
        } 
        
        self.whisper(player, player.character.replyto + ' ' + what);
    }
    
    self.attack = function(player, target) {
        //Target needs to be checked against players in room, so players can use abbr.
        if (target.length != 0)
        {
            player.character.room.eachPlayerExcept(player, function(p){
                p.msg(player.character.htmlname + " uses Attack Button O\' Doom on " + target);
            });
            player.msg("You use Attack Button O\' Doom on " + target);
        }
        else { player.msg("You do not have a target!"); }
    }
    
    self.me = function(player, emote) {
        console.log(emote.substr(emote.length - 1, 1));
        if (emote.substr(emote.length - 1, 1) != '!' && emote.substr(emote.length - 1, 1) != '?' && emote.substr(emote.length - 1, 1) != '.') emote += '.';
        player.character.room.eachPlayer(function(p){
            p.msg(player.character.htmlname + ' ' + emote);
        });
    }
    
    self.emote = function(player, emote) {
        switch(emote){
            case 'lol':
                self.lol(player);
                break;
            case 'sit':
                self.sit(player);
                break;
            default:
                return false;
        }
        return true;
    }
    
    self.lol = function(player) {
        player.msg('You laugh.');
        player.character.room.eachPlayerExcept(player, function(p){
            p.msg(player.character.htmlname + ' laughs.');
        });
    }
    
    self.sit = function(player) {
        player.msg('You sit on the ground.');
        //Trigger sitting state.
        player.character.room.eachPlayerExcept(player, function(p){
            p.msg(player.character.htmlname + ' sits on the ground.');
        });
    }
};

exports.Logic = Logic;