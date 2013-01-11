var Logic = function() {
    var self = this;
    
    /* ## LOGIC HELPER FUNCTIONS ## */
    self._invalidcmd = function(p) {
        p.msg('That command is not recognized. Try again.');
        return true;
    };
    self._createTable = function(title, data) {
        var output = "<br><table class='embed'><tr><td colspan='2' class='title'>" + title + "</td>";
        output += "<tr><td class='head'>Property</td><td class='head'>Value</td></tr>";
        data.forEach(function(d){
            output += "<tr><td class='prop'>" + d.property + "</td>";
            output += "<td class='value'>" + d.value + "</td></tr>";
        });
        output += "</table>";
        return output;
    };
    self._createInvisTable = function(data, width) {
        var output = "<table width='" + width + "'>";
        data.forEach(function(row){
            output += "<tr>";
            row.forEach(function(cell){
                output += "<td style='" + cell.style + "'>" + cell.data + "</td>";
            });
            output += "</tr>";
        });
        return output;
    };
    /* ## END: LOGIC HELPER FUNCTIONS ## */

    /* ## LOGIN AUTHORIZATION ## */
    self.login = function(player, data) {
        // already logged in?
        var logged_in = false;
        PLAYERS.eachOnline(function(p){
            if(p.character.id == data.id) {
                player.msg("You're already logged in somewhere else. Disconnecting..");
                p.msg("<span class='bred'>Warning!</span> Someone else attempted to log in to this character.");
                player.socket.disconnect();
                logged_in = true;
            }
        });
        if(logged_in) return;
        console.log('got a login from ' + data.name + ' (id: ' + data.id + ')');
        player.character = CHARACTERS.getCharacterById(data.id);
        if(!player.character) {
            player.msg("<br>I've never seen you around here before. You must be new!");
            var gamechar = CHARACTERS.create(data.id, data.name);
            player.character = gamechar;
            player.character.picture = data.picture;
            player.character.player = player;
            player.character.nickname = data.nick;
            if(gamechar) {
                player.msg('<br><b>Horray!</b> Your character has been created. You\'re now known to the world as ' + gamechar.htmlname + '.');
                player.character.login();
            } else {
                player.msg('<br><b>Drat!</b> For some reason, your character could not be created. Try again later.');
            }
        } else {
            player.character.picture = data.picture;
            player.character.player = player;
            player.character.nickname = data.nick;
            player.msg("<br>Welcome back to Armeria, " + player.character.htmlname + "!");
            player.character.login();
        }
    }
    /* ## END: LOGIN AUTHORIZATION ## */

    /* ## BASIC ## */
    self.say = function(player, what) {
        if(what.length == 0) self.look(player);
        if(what.toLowerCase() == "lol") { self.lol(player); return; }
        if(what == '^') { self.agree(player); return; }
        
        // Check arguments
        var args = what.split(' ');
        if(args[0] == '-history') {
            if(!player.character.room.sayhistory.length) {
                player.msg('No history found.');
                return;
            }
            var amount = parseInt(args[1]) || 10;
            var start = player.character.room.sayhistory.length - amount;
            if(start < 0)
                start = 0;
            player.msg('Showing last ' + amount + ' say messages (oldest to newest) in room:');
            for(var i = start; i < player.character.room.sayhistory.length; i++) {
                player.msg('[HISTORY] ' + player.character.room.sayhistory[i]);
            }
            return;
        }

        //Customize output depending on sentence punctuation.
        var isQuestion = false;
        var isExcited = false;
        var msgStart = " says, '";
        var msgStart_self = "You say, '";
        var lastChar = what.substr(what.length - 1, 1);
        var lastChar2 = what.substr(what.length - 2, 1);
        if (lastChar === '?' || lastChar2 === '?') { isQuestion = true; }
        if (lastChar === '!' || lastChar2 === '!') { isExcited = true; }
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
        player.character.room.updateSaveHistory(player.character.htmlname + msgStart + what + "'");
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
            player.emit("sound", {sfx: 'walk_grass_1.mp3', volume: 75});
        }
    }

    self.teleport = function(player, args) {
        if(!player.character.builder) { return self._invalidcmd(player); }
        var first = getarg(args, 0, false);
        var second = getarg(args, 1, false);
        var third = getarg(args, 2, false);
        var fourth = getarg(args, 3, false);
        var dest_map = player.character.location.map;
        var dest_x = player.character.location.x;
        var dest_y = player.character.location.y;
        var dest_z = player.character.location.z;
        // check if first argument is a player
        var char = CHARACTERS.getCharacterByName(first, true, true);
        if(char) {
            dest_map = char.location.map;
            dest_x = char.location.x;
            dest_y = char.location.y;
            dest_z = char.location.z;
        } else if (first && second && third === false && fourth == false) {
            dest_x = first;
            dest_y = second;
        } else if (first && second && third && fourth == false) {
            dest_x = first;
            dest_y = second;
            dest_z = third;
        } else if (first && second && third && fourth) {
            dest_map = first;
            dest_x = second;
            dest_y = third;
            dest_z = fourth;
        } else{
            player.msg("Teleport failed. Invalid destination.");
            player.emit("mapnomove", false);
            return;
        }
        // do the teleport
        var old_room = player.character.room;
        var new_room = WORLD.getMap(dest_map).getRoom(dest_x, dest_y, dest_z);
        if(!new_room) {
            player.msg("Teleport failed. Invalid destination.");
            player.emit("mapnomove", false);
            return;
        }
        // announce
        if(player.character.switchRooms(dest_map, dest_x, dest_y, dest_z)) {
            old_room.eachPlayerExcept(player, function(p){
                p.msg(player.character.htmlname + ' disappeared in a flash of light!');
                p.emit("sound", {sfx: 'teleport.mp3', volume: 75});
            });
            new_room.eachPlayerExcept(player, function(p){
                p.msg(player.character.htmlname + ' appeared in a puff of smoke!');
                p.emit("sound", {sfx: 'teleport.mp3', volume: 75});
            });
            player.msg('<br>You teleported to a new location. Woosh!');
            self.look(player);
            player.emit("sound", {sfx: 'teleport.mp3', volume: 75});
        }
    }

    self.look = function(player) {
        if(player.character.builder)
            player.msg('<br/><span class="yellow">' + player.character.room.name + '</span> (' + player.character.location.x + ',' + player.character.location.y + ',' + player.character.location.z + ')<br/>' + player.character.room.desc);
        else
            player.msg('<br/><span class="yellow">' + player.character.room.name + '</span><br/>' + player.character.room.desc);
        player.character.room.eachPlayerExcept(player, function(p){
                player.msg(p.character.htmlname + ' ' + p.character.roomdesc);
        });
    }
    
    self.whisper = function(player, args) {
        var who = getarg(args, 0, false);
        var what = getarg(args, 1, true);
        
        var target = CHARACTERS.getCharacterByName(who, true, true);
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

    self.attack = function(player, args) {
        var who = args.split(' ')[0];
        who = who.replace('.', ' ');
        var target = CHARACTERS.getCharacterByName(who, true);

        //TODO Check player and target location's match.
        if (target)
        {
            if (target.player.character.name == player.character.name) { player.msg("You cannot attack yourself!"); return; }
            if (target.player.character.stats.health > 0)
            {
                COMBAT.normalAttack(player, target);
            } else { player.msg("Your target is dead!"); }
        }
        else { player.msg("You do not have a target."); }
    }

    self.create = function(player, args) {
        if(!player.character.builder) { return self._invalidcmd(player); }
        var creation = args.split(' ')[0];
        var argsremaining = args.split(' ').splice(1).join(' ');
        creation = matchcmd(creation, new Array(['room', 'rm']));
        switch(creation.toLowerCase()) {
            case 'room':
                player.character.room.map.createRoom(player, argsremaining);
                break;
            default:
                player.msg("Unknown creation item.");
        }
    }

    self.destroy = function(player, args) {
        if(!player.character.builder) { return self._invalidcmd(player); }
        var destruction = args.split(' ')[0];
        var argsremaining = args.split(' ').splice(1).join(' ');
        destruction = matchcmd(destruction, new Array(['room', 'rm']));
        switch(destruction.toLowerCase()) {
            case 'room':
                player.character.room.map.destroyRoom(player, argsremaining);
                break;
            default:
                player.msg("Unknown destruction item.");
        }
    }

    self.modify = function(player, args) {
        if(!player.character.builder) { return self._invalidcmd(player); }
        var modification = args.split(' ')[0];
        var argsremaining = args.split(' ').splice(1).join(' ');
        modification = matchcmd(modification, new Array(['room', 'rm']));
        switch(modification.toLowerCase()) {
            case 'room':
                player.character.room.map.modifyRoom(player, argsremaining);
                break;
            default:
                player.msg("Unknown modification item.");
        }
    }

    self.channels = function(player) {
        if(!player.character.channels.length)
            player.msg("You're not connected to any channels. Womp!");
        else
            player.msg("You're connected to the following channels: " + player.character.channels.join(" "));
    }

    self.channel = function(player, channel, args) {
        var chan_color;
        switch(channel) {
            case 'builder':
                chan_color = 'orange';
                break;
            case 'gossip':
                chan_color = 'pink';
                break;
            default:
                chan_color = 'white';
        }
        if(!args) {
            // join or leave channel
            // special checks
            switch(channel) {
                case 'builder':
                    if(!player.character.builder) {
                        player.msg("You cannot join this channel.");
                        return;
                    }
                    break;
            }
            // are you in this channel already?
            if(player.character.channels.indexOf(channel) >= 0) {
                var i = player.character.channels.indexOf(channel);
                player.character.channels.splice(i, 1);
                player.msg("You left the " + channel.toUpperCase() + " channel.");
                PLAYERS.eachOnlineInChannel(channel, function(p){
                    p.msg("<span class='" + chan_color + "'>(" + channel.substr(0, 1).toUpperCase() + channel.substr(1) + ") " + player.character.htmlname + " left the channel.</span>");
                });
            } else {
                player.character.channels.push(channel);
                player.msg("You join the " + channel.toUpperCase() + " channel.");
                PLAYERS.eachOnlineInChannelExcept(player, channel, function(p){
                    p.msg("<span class='" + chan_color + "'>(" + channel.substr(0, 1).toUpperCase() + channel.substr(1) + ") " + player.character.htmlname + " joined the channel.</span>");
                });
            }
        } else {
            // are you in the channel?
            if(player.character.channels.indexOf(channel) == -1) {
                player.msg("You are not in this channel. Use <span class='yellow'>/" + channel + "</span> to join it.");
                return;
            }
            // say to channel
            PLAYERS.eachOnlineExcept(player, function(p){
                if(p.character.channels.indexOf(channel) >= 0) {
                    p.msg("<span class='" + chan_color + "'>(" + channel.substr(0, 1).toUpperCase() + channel.substr(1) + ") " + player.character.htmlname + " says, '" + args + "'</span>");
                }
            });
            player.msg("<span class='" + chan_color + "'>(" + channel.substr(0, 1).toUpperCase() + channel.substr(1) + ") You say, '" + args + "'</span>");
        }
    }

    self.cast = function(player, args) {
        var what = args.split(' ')[0];
        var who = args.split(' ').splice(1).join(' ');
        who = who.replace('.', ' ');
        var target = CHARACTERS.getCharacterByName(who, true);

        //TODO Check player and target location's match.
        if (target)
        {
            switch(what) {
                case 'heal':
                    COMBAT.heal(player, target);
                    break;
                case 'kamehameha':
                    COMBAT.kamehameha(player, target);
                    break;
                default:
                    player.msg("Invalid spell.");
            }
        }
        else { player.msg("You do not have a target."); }
    };

    self.library = function(player, args) {
        if(!player.character.builder) { return self._invalidcmd(player); }
        var creation = args.split(' ')[0];
        var argsremaining = args.split(' ').splice(1).join(' ');
        creation = matchcmd(creation, new Array(['additem', 'ai']));
        switch(creation.toLowerCase()) {
            case 'additem':
                LIBRARY.addItem(player, argsremaining);
                break;
            default:
                player.msg("Unknown library function.");
        }

    };
    self.who = function(player) {
        var tabledata = [];
        var count = 0;
        PLAYERS.eachOnline(function(p){
            tabledata.push([{
                data: 'BUILDER',
                style: ''
            },
            {
                data: p.character.htmlname,
                style: ''
            }]);
            count++;
        });
        player.msg(self._createInvisTable(tabledata, '280px'));
        player.msg('There are ' + count + ' visible player' + ((count>1)?'s':'') + ' online.');
    };
    /* ## END: BASIC ## */

    /*  ## ITEM MANAGEMENT ## */
    self.inventory = function(player) {
        if(player.character.inventory.length == 0) {
            player.msg('You are not carrying anything.');
            return;
        }
        var inv = 'You are carrying:';
        player.character.eachInventoryItem(function(item){
            inv += '<br>&nbsp;&nbsp;&nbsp;&nbsp;' + item.ttOutput();
        });
        player.msg(inv);
    };
    /*  ## END: ITEM MANAGEMENT ## */

    /*  ## EMOTES ## */
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
            case 'sleep':
            	self.sleep(player);
            	break;
            case '^':
                self.agree(player);
                break;
            case 'agree':
                self.agree(player);
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
    
    self.sleep = function(player) {
        player.msg('You lie down and fall asleep. ZzzZzz..');
        //Trigger sitting state.
        player.character.room.eachPlayerExcept(player, function(p){
            p.msg(player.character.htmlname + ' lies down and falls asleep. ZzzZzz..');
        });
    }

    self.agree = function(player) {
        player.msg('You agree.');
        player.character.room.eachPlayerExcept(player, function(p){
            p.msg(player.character.htmlname + ' agrees.');
        });
    }
    /*  ## END: EMOTES ## */
};

exports.Logic = Logic;