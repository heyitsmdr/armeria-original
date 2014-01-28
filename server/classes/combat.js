var Combat = function() {
    var self = this;

    self.attack = function(player, args) {
    	var target = getarg(args, 0, true);

    	if(!target) {
    		player.msg('There is no target for your attack.');
    		return;
    	}

    	var targetObject = false;

    	// check energy (requires 100);
    	if(player.character.stats.energy < 100) {
    		player.msg('You don\'t have enough energy.');
    		return;
    	}

    	player.character.stats.energy = player.character.stats.energy - 100;

        player.update({bars:true});

        player.msg('You attacked ' + args + '.');
    }

};
exports.Combat = Combat;