/**
 * Created with JetBrains WebStorm.
 * User: Josh
 * Date: 12/26/12
 * Time: 7:08 PM
 * To change this template use File | Settings | File Templates.
 */
var Combat = function() {
    var self = this;

    self.isMiss = function(player, target, name, type) {
        var playerLevel = player.character.level;
        var targetLevel = target.player.character.level;
        var playerStat = 0;
        var targetStat = 0;
        switch(type) {
            case 'melee':
                playerStat = player.character.stats.agi;
                targetStat = target.player.character.stats.agi;
                break;
            case 'magic':
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
            case 'melee':
                playerStat = player.character.stats.agi;
                targetStat = target.player.character.stats.agi;
                break;
            case 'magic':
                playerStat = player.character.stats.int;
                targetStat = target.player.character.stats.agi;
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

    self.calculateDamage = function(player, target, name, type, modifier) {
        //TODO Can use different stats for damage calculation based on 'type'.
        var weaponmin = 4;
        var weaponmax = 7;

        var dmg = Math.floor(((Math.random() * (weaponmax - weaponmin + 1)) + weaponmin) + modifier);
        target.player.character.stats.health -= dmg;
        player.msg("You slap " + target.htmlname + " for " + dmg + " damage!");
        //player.msg("Target's Remaining Health: " + target.player.character.stats.health);
        target.player.msg(player.character.htmlname + " slaps you for " + dmg + " damage!");
        //target.player.msg("Remaining Health: " + target.player.character.stats.health);
    }

    self.calculateHealing = function(player, target, name, type, modifier) {
        //TODO 'fizzle' chance based on type of healing? Real formula.
        var healing = Math.floor(player.character.stats.int * 2 + modifier);
        var maxHealth = target.player.character.stats.maxhealth;
        var newHealth = target.player.character.stats.health + healing;
        if (newHealth > maxHealth) {
            target.player.character.stats.health = maxHealth;
        } else {
            target.player.character.stats.health = newHealth;
        }

        player.msg("Your " + name + " heals " + target.player.character.htmlname + " for " + healing + " health.");
        target.player.msg(player.character.htmlname + "'s " + name + " heals you for " + healing + " health.");
    }

    /*  ## ATTACKS / SPELLS ## */
    self.normalAttack = function(player, target) {
        var name = 'slap';
        var type = 'melee';
        var modifier = (player.character.stats.str / 2);

        if (!self.isMiss(player, target, name, type)) {
            if (!self.isDodged(player, target, name, type)) {
                self.calculateDamage(player, target, name, type, modifier);
            }
        }
    }

    self.heal = function(player, target) {
        var name = 'Divine Light';
        var type = 'magic';
        var modifier = (player.character.stats.int / 2);

        self.calculateHealing(player, target, name, type, modifier);
    }
};
exports.Combat = Combat;