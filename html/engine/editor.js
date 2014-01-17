var self = GameEngine;

self.editorstage = false;
self.editorrenderer = false;
self.editorcontainer = false;
self.editormovement = false;
self.editormovestartx = 0;
self.editormovestarty = 0;
self.containerx = 0;
self.containery = 0;

self.editorInit = function(height, width) {
    // convert to real sizes
    height *= 32;
    width *= 32;
    // set up stage
    $('#editor-grids').html('');
    $('#editor-grids').height(height);
    $('#editor-grids').width(width);
    self.editorstage = new PIXI.Stage(0x262626);
    self.editorrenderer = PIXI.autoDetectRenderer(height, width, null, true);
    // append
    document.getElementById('editor-grids').appendChild(self.editorrenderer.view);
    // init container
    self.editorcontainer = new PIXI.DisplayObjectContainer();
    // add to stage
    self.editorstage.addChild(self.editorcontainer);
    // restore position?
    if(self.containerx && self.containery) {
        self.editorcontainer.position.x = self.containerx;
        self.editorcontainer.position.y = self.containery;
    }
    // setup stage callbacks
    self.editorstage.mousedown = self.editorStartPositionChange;
    self.editorstage.mouseup = self.editorEndPositionChange;
    self.editorstage.mouseout = self.editorEndPositionChange;
};

self.editorPixiRender = function() {
    if(!self.editorstage)
        return;

    self.editorrenderer.render(self.editorstage);
};

self.editorRender = function(){
    var location = self.maproom;

    if (!location) {
        console.log('editor: render failed (' + location + ') failed - location was false');
        return false;
    }

    // clear current stage
    self.editorcontainer.children.forEach(function(child) {
        self.editorcontainer.removeChild(child);
    });

    self.mapdata.forEach(function(room) {
        var tileBase = room.terrain.split(' ')[0];
        var tilePrimary = room.terrain.split(' ')[1];
        var tileEdges = room.terrain.split(' ')[2];

        var tileBaseSheet = tileBase.split('.')[0];
        var tileBaseTile = tileBase.split('.')[1];
        var tilePrimarySheet = tilePrimary.split('.')[0];
        var tilePrimaryTile = tilePrimary.split('.')[1];

        if(room.z == location.z) {
            var spriteRoom = new PIXI.DisplayObjectContainer();
            spriteRoom.hitArea = new PIXI.Rectangle(room.x * 32, room.y * 32, 32, 32);
            spriteRoom.interactive = true;

            if(tileBase != "null") {
                var base = new PIXI.Sprite(self.mapts[tileBaseSheet][tileBaseTile].texture);
                base.position.x = room.x * 32;
                base.position.y = room.y * 32;
                base.interactive = true;
                spriteRoom.addChild(base);
            }
            
            if(tilePrimary != "null") {
                var primary = new PIXI.Sprite(self.getPrimaryTextureWithEdges(tilePrimarySheet, tilePrimaryTile, tileEdges.substr(0, 4)));
                primary.position.x = room.x * 32;
                primary.position.y = room.y * 32;
                primary.interactive = true;
                spriteRoom.addChild(primary);
            }

            if(room.x == location.x && room.y == location.y) {
                var markTexture = PIXI.Texture.fromImage('images/tiles/playerMark.png');
                var markSprite = new PIXI.Sprite(markTexture);
                markSprite.position.x = room.x * 32;
                markSprite.position.y = room.y * 32;
                spriteRoom.addChild(markSprite);
            }

            spriteRoom.mouseup = self.gridClick;
            self.editorcontainer.addChild(spriteRoom);
        }
    });
};

self.editorStartPositionChange = function(interactionData) {
    self.editormovestartx = interactionData.global.x;
    self.editormovestarty = interactionData.global.y;
    self.editormovement = setInterval(function(){
        var pos = self.editorstage.getMousePosition();
        var diffx = pos.x - self.editormovestartx;
        var diffy = pos.y - self.editormovestarty;

        self.editorcontainer.position.x += diffx;
        self.editorcontainer.position.y += diffy;

        self.containerx = self.editorcontainer.position.x;
        self.containery = self.editorcontainer.position.y;

        self.editormovestartx = pos.x;
        self.editormovestarty = pos.y;
    }, 10);
};

self.editorEndPositionChange = function(interactionData) {
    if(!self.editormovement)
        return;
    clearInterval(self.editormovement);
    self.editormovement = false;
};

self.toggleEditor = function (data) {
    if ($('#editor-container').css('display') === 'none') {
        $('#editor-container').stop().fadeIn('fast', function () {
            // ready
            GameEngine.editorInit(16, 16);
            GameEngine.editorRender();
            GameEngine.editorData(data);
        });
    } else {
        $('#editor-container').stop().fadeOut('fast');
        self.editorEndPositionChange();
    }
};

self.editorData = function (data) {
    // area data
    $('#map-name').html(data.mapData.name);
    $('#map-author').html(data.mapData.author);

    // room data
    $('#room-name').html(data.roomData.name);

    $('#room-desc').html(data.roomData.desc);
    GameEngine.registerToolTip('#room-desc', data.roomData.desc);

    $('#room-terrain').html(data.roomData.type);
    GameEngine.registerToolTip('#room-terrain', data.roomData.type);
    $('#room-terrain-base').html('<option>null</option>');
    $('#room-terrain-primary').html('<option>null</option>');
    $('#builder-terrain-base').html('<option>null</option>');
    $('#builder-terrain-primary').html('<option>null</option>');
    GameEngine.tilesets.forEach(function (ts) {
        Object.keys(GameEngine.mapts[ts]).forEach(function(tile) {
            if(tile != 'baseTexture') {
                var def = ts + '.' + tile;
                $('#room-terrain-base').append('<option ' + ((def === data.roomData.type.split(' ')[0]) ? 'selected' : '') + '>' + def + '</option>');
                $('#room-terrain-primary').append('<option ' + ((def === data.roomData.type.split(' ')[1]) ? 'selected' : '') + '>' + def + '</option>');
                $('#builder-terrain-base').append('<option>' + def + '</option>');
                $('#builder-terrain-primary').append('<option>' + def + '</option>');
            }
        });
    });
    $('#room-terrain-corners-t').prop('checked', ((data.roomData.type.split(' ')[2].substr(0, 1) === '1') ? true : false));
    $('#room-terrain-corners-r').prop('checked', ((data.roomData.type.split(' ')[2].substr(1, 1) === '1') ? true : false));
    $('#room-terrain-corners-b').prop('checked', ((data.roomData.type.split(' ')[2].substr(2, 1) === '1') ? true : false));
    $('#room-terrain-corners-l').prop('checked', ((data.roomData.type.split(' ')[2].substr(3, 1) === '1') ? true : false));

    $('#room-environment').html(data.roomData.environment);
    // section title
    $('#section-roomprops').html('Current Room Properties (' + data.roomData.x + ',' + data.roomData.y + ',' + data.roomData.z + ')');
};

self.editorToggleExtra = function (toggleId) {
    if ($('#' + toggleId).css('display') === 'none') {
        $('#' + toggleId).show('slide', {direction: 'up'});
    } else {
        $('#' + toggleId).hide('slide', {direction: 'up'});
    }
};

self.editorSetTerrain = function () {
    var typeString = $('#room-terrain-base').val() + ' ' + $('#room-terrain-primary').val() + ' ';
    if ($('#room-terrain-corners-t').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
    if ($('#room-terrain-corners-r').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
    if ($('#room-terrain-corners-b').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
    if ($('#room-terrain-corners-l').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
    // set within editor
    $('#room-terrain').html(typeString);
    // send to server
    GameEngine.parseCommand('/room terrain ' + typeString);
    GameEngine.socket.emit('cmd', {cmd: 'edit refresh'});
};

self.editorSetDefaultTerrain = function () {
    $('#builder-terrain').html($('#builder-terrain-base').val() + ' ' + $('#builder-terrain-primary').val());
};

self.editorChangeClickAction = function () {
    if ($('#builder-clickaction').data('action') == 'teleport') {
        $('#builder-clickaction').html('<span style="color:#51fc5c">build</span>');
        $('#builder-clickaction').data('action', 'build');
    } else if ($('#builder-clickaction').data('action') == 'build') {
        $('#builder-clickaction').html('<span style="color:#fc6d51">destroy</span>');
        $('#builder-clickaction').data('action', 'destroy');
    } else {
        $('#builder-clickaction').html('<span style="color:#51d2fc">teleport</span>');
        $('#builder-clickaction').data('action', 'teleport');
    }
};

self.editorEditProperty = function (prop) {
    var newContent = prompt('Set property to:', $(prop).html());
    if (newContent) {
        // set within editor
        $(prop).html(newContent);
        // send to server
        if ($(prop).attr('id').split('-')[0] === 'room') {
            GameEngine.parseCommand('/room ' + $(prop).attr('id').split('-')[1] + ' ' + newContent);
        }
    }
};

self.gridClick = function(evt) {
    if(!evt.originalEvent.shiftKey)
        return false;

    var x = evt.target.children[0].position.x / 32;
    var y = evt.target.children[0].position.y / 32;

    if ($('#builder-clickaction').data('action') == 'teleport') {
        GameEngine.socket.emit('cmd', {cmd: 'tp ' + x + ' ' + y});
    }

    GameEngine.socket.emit('cmd', {cmd: 'edit refresh'});
}

self.editorClick = function (evt) {
    var sizew, sizeh, x, y;
    // calculate relative x and y
    sizew = (document.getElementById('editor-canvas').width / 32) - 1;
    sizeh = (document.getElementById('editor-canvas').height / 32) - 1;
    x = Math.floor((evt.x - $('#editor-canvas').offset().left) / 32) - (sizew / 2);
    y = Math.floor((evt.y - $('#editor-canvas').offset().top) / 32) - (sizeh / 2);
    // convert to absolute (based on current location)
    x = parseInt(GameEngine.maproom.x, 10) + parseInt(x, 10);
    y = parseInt(GameEngine.maproom.y, 10) + parseInt(y, 10);
    // send to server
    if ($('#builder-clickaction').data('action') == 'teleport') {
        GameEngine.socket.emit('cmd', {cmd: 'tp ' + x + ' ' + y});
    } else if ($('#builder-clickaction').data('action') == 'build') {
        if ($('#builder-terrain').html() === 'null null') {
            $.gritter.add({title: 'Build Error', text: 'Please set a Default Terrain before building.'});
        } else {
            GameEngine.socket.emit('cmd', {cmd: 'create room @' + x + ',' + y + ',' + GameEngine.maproom.z + ' -terrain "' + $('#builder-terrain').html() + ' 00000000"'});
        }
    } else if ($('#builder-clickaction').data('action') == 'destroy') {
        GameEngine.socket.emit('cmd', {cmd: 'destroy room @' + x + ',' + y + ',' + GameEngine.maproom.z});
    }
    GameEngine.socket.emit('cmd', {cmd: 'edit refresh'});
};
