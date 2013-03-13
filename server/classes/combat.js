var Combat = function() {
    var self = this;

    self.isMiss = function(player, target, name, type) {
        var playerLevel = player.character.level;
        var targetLevel = target.player.character.level;
        var playerStat = 0;
        var targetStat = 0;
        switch(type) {
            case 'physical':
                playerStat = player.character.stats.agi;
                targetStat = target.player.character.stats.agi;
                break;
            case 'elemental':
                playerStat = player.character.stats.int;
                targetStat = target.player.character.stats.int;
                break;
            case 'arcane':
                playerStat = player.character.stats.int;
                targetStat = target.player.character.stats.int;
                break;
            case 'mental':
                playerStat = player.character.stats.int;
                targetStat = target.player.character.stats.int;
                break;
            default:
                playerStat = player.character.stats.agi;
                targetStat = target.player.character.stats.agi;
        }
        var miss = Math.floor(95 + (playerLevel - targetLevel) * 0.5);
        var roll = Math.floor(Math.random() * (100 - 1 + 1) + 1);
        if (roll >= miss) {
            player.msg("Your " + name + " misses " + target.player.character.htmlname + ".");
            target.player.msg(player.character.htmlname + "'s " + name + " misses you.");
            return true;
        }
        else {
            return false;
        }
    }

    self.isDodged = function(player, target, name, type) {
        var playerLevel = player.character.level;
        var targetLevel = target.player.character.level;
        var playerStat = 0;
        var targetStat = 0;
        switch(type) {
            case 'physical':
                playerStat = player.character.stats.agi;
                targetStat = target.player.character.stats.agi;
                break;
            case 'elemental':
                playerStat = player.character.stats.int;
                targetStat = target.player.character.stats.agi;
                break;
            case 'arcane':
                playerStat = player.character.stats.int;
                targetStat = target.player.character.stats.agi;
                break;
            case 'mental':
                playerStat = player.character.stats.int;
                targetStat = target.player.character.stats.int;
                break;
            default:
                playerStat = player.character.stats.agi;
                targetStat = target.player.character.stats.agi;
        }
        var dodge = Math.floor(95 + (playerLevel - targetLevel) * 0.25 + (playerStat - targetStat) * 0.35);
        var roll = Math.floor(Math.random() * (100 - 1 + 1) + 1);
        if (roll >= dodge) {
            player.msg(target.player.character.htmlname + " dodges your " + name + ".");
            target.player.msg("You dodge " + player.character.htmlname + "'s " + name + ".");
            return true;
        }
        else {
            return false;
        }
    }

    self.isCrit = function(player, target, type) {
        var playerLevel = player.character.level;
        var targetLevel = target.player.character.level;
        var playerStat = 0;
        var targetStat = 0;
        switch(type) {
            case 'physical':
                playerStat = player.character.stats.agi;
                targetStat = target.player.character.stats.agi;
                break;
            case 'elemental':
                playerStat = player.character.stats.int;
                targetStat = target.player.character.stats.agi;
                break;
            case 'arcane':
                playerStat = player.character.stats.int;
                targetStat = target.player.character.stats.agi;
                break;
            case 'mental':
                playerStat = player.character.stats.int;
                targetStat = target.player.character.stats.int;
                break;
            default:
                playerStat = player.character.stats.agi;
                targetStat = target.player.character.stats.agi;
        }
        var crit = Math.floor(95 + (playerLevel - targetLevel) * 0.25 + (playerStat - targetStat) * 0.35);
        var roll = Math.floor(Math.random() * (100 - 1 + 1) + 1);
        if (roll >= crit) {
            return true;
        }
        else {
            return false;
        }
    }

    self.calculateDamage = function(player, target, name, type, modifier) {
        //TODO Different calculations based on attack type.
        if (self.isMiss(player, target, name, type)) { return; }
        if (self.isDodged(player, target, name, type)) { return; }
        var crit = self.isCrit(player, target, type);

        var weaponmin = 4;
        var weaponmax = 7;
        var dmg = 0;

        switch (type) {
            case 'physical':
                break;
            case 'elemental':
                break;
            case 'arcane':
                break;
            case 'mental':

        }
        var targetArmor = target.player.character.stats.armor;

        if(!crit) {
            dmg = Math.floor(((Math.random() * (weaponmax - weaponmin + 1)) + weaponmin) + modifier);
            dmg = Math.floor(dmg - ((dmg / 100) * (targetArmor / 7)));
            target.player.character.stats.health -= dmg;
            player.msg("Your " + name + " hits " + target.htmlname + " for " + dmg + " damage.");
            target.player.msg(player.character.htmlname + "'s " + name + " hits you for " + dmg + " damage.");
        } else {
            dmg = Math.floor(weaponmax + (modifier * 2));
            dmg = Math.floor(dmg - ((dmg / 100) * (targetArmor / 7)));
            target.player.character.stats.health -= dmg;
            player.msg("Your " + name + " critically hits " + target.htmlname + " for " + dmg + " damage!");
            target.player.msg(player.character.htmlname + "'s " + name + " critically hits you for " + dmg + " damage!");
        }
    }

    self.calculateHealing = function(player, target, name, type, modifier) {
        var currentHealth = target.player.character.stats.health;
        var maxHealth = target.player.character.stats.maxhealth;

        if (currentHealth == maxHealth) { player.msg(target.player.character.htmlname + " is already at full health."); return; }

        var healing = Math.floor(player.character.stats.int * 2 + modifier);
        var newHealth = currentHealth + healing;

        if (newHealth > maxHealth) {
            target.player.character.stats.health = maxHealth;
            healing = maxHealth - currentHealth;
        } else {
            target.player.character.stats.health = newHealth;
        }
        player.msg("Your " + name + " heals " + target.player.character.htmlname + " for " + healing + " health.");
        target.player.msg(player.character.htmlname + "'s " + name + " heals you for " + healing + " health.");
    }

    /*  ## ATTACKS / SPELLS ## */
    self.normalAttack = function(player, target) {
        var name = 'attack';
        var type = 'physical';
        var modifier = (player.character.stats.str * 0.5);

        self.calculateDamage(player, target, name, type, modifier);
    }

    self.heal = function(player, target) {
        var name = 'Divine Light';
        var type = 'arcane';
        var modifier = (player.character.stats.int * 0.5);

        self.calculateHealing(player, target, name, type, modifier);
    }

    self.kamehameha = function(player, target) {
        var name = 'Kamehameha';
        var type = 'elemental';
        var modifier = (player.character.stats.int * 0.75);

        self.calculateDamage(player, target, name, type, modifier);
    }
};
exports.Combat = Combat;