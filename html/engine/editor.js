var self = GameEngine;

self.editorToggleExtra = function (toggleId) {
    if ($('#' + toggleId).css('display') === 'none') {
        $('#' + toggleId).show('slide', {direction: 'up'});
    } else {
        $('#' + toggleId).hide('slide', {direction: 'up'});
    }
};

self.toggleEditor = function (data) {
    if ($('#editor-container').css('display') === 'none') {
        $('#editor-container').stop().fadeIn('fast', function () {
            // ready
            GameEngine.editorInit(16, 16);
            GameEngine.editorRender(false);
            GameEngine.editorData(data);
        });
    } else {
        $('#editor-container').stop().fadeOut('fast');
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
    $('#room-terrain-base').html('');
    $('#room-terrain-primary').html('');
    $('#builder-terrain-base').html('');
    $('#builder-terrain-primary').html('');
    GameEngine.tilesets.forEach(function (ts) {
        GameEngine.mapts[ts].forEach(function (tile) {
            var def = ts + '.' + tile.def;
            $('#room-terrain-base').append('<option ' + ((def === data.roomData.type.split(' ')[0]) ? 'selected' : '') + '>' + def + '</option>');
            $('#room-terrain-primary').append('<option ' + ((def === data.roomData.type.split(' ')[1]) ? 'selected' : '') + '>' + def + '</option>');
            $('#builder-terrain-base').append('<option>' + def + '</option>');
            $('#builder-terrain-primary').append('<option>' + def + '</option>');
        });
    });
    $('#room-terrain-corners-t').prop('checked', ((data.roomData.type.split(' ')[2].substr(0, 1) === '1') ? true : false));
    $('#room-terrain-corners-r').prop('checked', ((data.roomData.type.split(' ')[2].substr(1, 1) === '1') ? true : false));
    $('#room-terrain-corners-b').prop('checked', ((data.roomData.type.split(' ')[2].substr(2, 1) === '1') ? true : false));
    $('#room-terrain-corners-l').prop('checked', ((data.roomData.type.split(' ')[2].substr(3, 1) === '1') ? true : false));
    $('#room-terrain-corners-tl').prop('checked', ((data.roomData.type.split(' ')[2].substr(4, 1) === '1') ? true : false));
    $('#room-terrain-corners-tr').prop('checked', ((data.roomData.type.split(' ')[2].substr(5, 1) === '1') ? true : false));
    $('#room-terrain-corners-br').prop('checked', ((data.roomData.type.split(' ')[2].substr(6, 1) === '1') ? true : false));
    $('#room-terrain-corners-bl').prop('checked', ((data.roomData.type.split(' ')[2].substr(7, 1) === '1') ? true : false));

    $('#room-environment').html(data.roomData.environment);
    // section title
    $('#section-roomprops').html('Current Room Properties (' + data.roomData.x + ',' + data.roomData.y + ',' + data.roomData.z + ')');
};

self.editorSetTerrain = function () {
    var typeString = $('#room-terrain-base').val() + ' ' + $('#room-terrain-primary').val() + ' ';
    if ($('#room-terrain-corners-t').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
    if ($('#room-terrain-corners-r').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
    if ($('#room-terrain-corners-b').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
    if ($('#room-terrain-corners-l').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
    if ($('#room-terrain-corners-tl').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
    if ($('#room-terrain-corners-tr').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
    if ($('#room-terrain-corners-br').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
    if ($('#room-terrain-corners-bl').prop('checked')) { typeString += '1'; } else { typeString += '0'; }
    // set within editor
    $('#room-terrain').html(typeString);
    // send to server
    GameEngine.parseCommand('/room terrain ' + typeString);
};

self.editorSetDefaultTerrain = function () {
    $('#builder-terrain').html($('#builder-terrain-base').val() + ' ' + $('#builder-terrain-primary').val());
};

self.editorChangeClickAction = function () {
    if ($('#builder-clickaction').html() === 'teleport') {
        $('#builder-clickaction').html('build');
    } else {
        $('#builder-clickaction').html('teleport');
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

/**
    Note: sizeh and sizew must be divisible by 2.
    Todo: Move styles to stylesheet
**/
self.editorInit = function (sizeh, sizew) {
    var width = (sizew + 1) * 32, height = (sizeh + 1) * 32;
    $('#editor-grids').html('<canvas id="editor-canvas" width="' + width + '" height="' + height + '" onclick="GameEngine.editorClick(event)"></canvas>');
};

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
    if ($('#builder-clickaction').html() === 'teleport') {
        GameEngine.socket.emit('cmd', {cmd: 'tp ' + x + ' ' + y});
    } else if ($('#builder-clickaction').html() === 'build') {
        if ($('#builder-terrain').html() === 'null null') {
            $.gritter.add({title: 'Build Error', text: 'Please set a Default Terrain before building.'});
        } else {
            GameEngine.socket.emit('cmd', {cmd: 'create room @' + x + ',' + y + ',' + GameEngine.maproom.z + ' -terrain "' + $('#builder-terrain').html() + ' 00000000"'});
        }
    }
    GameEngine.socket.emit('cmd', {cmd: 'edit refresh'});
};

self.editorRender = function (location) {
    if (!location) {
        location = GameEngine.maproom;
    }
    if (!location) {
        console.log('GameEngine.editorRender(' + location + ') failed - location was false');
        return false;
    }

    var ctx, sizew, sizeh, xrangemin, xrangemax, yrangemin, yrangemax, offsetx, offsety, x, y, left, top, grid, layerBase, layerPrimary, layerEdgeCorners, defBase, defPrimary, tsBase, tsPrimary;

    ctx = document.getElementById('editor-canvas').getContext('2d');

    sizew = (document.getElementById('editor-canvas').width / 32) - 1;
    sizeh = (document.getElementById('editor-canvas').height / 32) - 1;
    xrangemin = parseInt(location.x, 10) - (sizew / 2);
    xrangemax = parseInt(location.x, 10) + (sizew / 2);
    yrangemin = parseInt(location.y, 10) - (sizeh / 2);
    yrangemax = parseInt(location.y, 10) + (sizeh / 2);
    offsetx = 0;
    offsety = 0;

    ctx.clearRect(0, 0, $('#editor-canvas').width(), $('#editor-canvas').height());

    for (y = yrangemin; y <= yrangemax; y++) {
        for (x = xrangemin; x <= xrangemax; x++) {
            left = offsetx;
            top = offsety;

            offsetx += 32;

            grid = GameEngine.mapGridAt(x, y, location.z);
            if (!grid) {
                continue;
            }

            layerBase = grid.terrain.split(' ')[0];
            layerPrimary = grid.terrain.split(' ')[1];
            layerEdgeCorners = grid.terrain.split(' ')[2];

            defBase = GameEngine.mapGetTilesetDefinition(layerBase);
            defPrimary = GameEngine.mapGetTilesetDefinition(layerPrimary);

            tsBase = layerBase.split('.')[0];
            tsPrimary = layerPrimary.split('.')[0];

            // render primary
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.sx, defPrimary.sy, 32, 32, left, top, 32, 32);

            // render edges and corners
            ctx.globalCompositeOperation = 'destination-out';
            if (layerEdgeCorners.substr(0, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeTop, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(1, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeRight, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(2, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeBottom, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(3, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeLeft, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(4, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerTopLeft, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(5, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerTopRight, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(6, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerBottomRight, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(7, 1) === '1') { ctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerBottomLeft, defPrimary.sy, 32, 32, left, top, 32, 32); }

            // render base
            ctx.globalCompositeOperation = 'destination-over';
            ctx.drawImage(GameEngine.maptileset[tsBase], defBase.sx, defBase.sy, 32, 32, left, top, 32, 32);

            // render marker if current (or rendered) location
            if (x === location.x && y === location.y) {
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(GameEngine.mapmarker, 0, 0, 30, 30, left + 1, top + 1, 30, 30);
            }
        }
        offsetx = 0;
        offsety += 32;
    }
};
