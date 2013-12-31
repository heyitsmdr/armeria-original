var self = GameEngine;

self.mapdata = false;       // Entire minimap data
self.mapz = 0;              // Map Z-Coordinate
self.maproom = false;       // Object within this.mapdata that contains the current room
self.mapctx = false;        // Minimap Canvas 2D Context
self.mapcv = false;         // Minimap Canvas
self.maptileset = [];       // Images of Tilesets
self.mapts = [];            // Image Properties
self.mapanim = false;       // Map Animation for setInterval
self.mapoffsetx = 0;        // Minimap offset - x
self.mapoffsety = 0;        // Minimap offset - y
self.mapdestoffsetx = 0;    // Minimap destination offset - x
self.mapdestoffsety = 0;    // Minimap destination offset - y
self.mapmarker = false;     // Image of Map Marker

self.mapGetTilesetDefinition = function (definition) {
    var tileset = definition.split('.')[0], tile = definition.split('.')[1], k;
    for (k = 0; k < GameEngine.mapts[tileset].length; k++) {
        if (GameEngine.mapts[tileset][k].def.toLowerCase() === tile.toLowerCase()) {
            return GameEngine.mapts[tileset][k];
        }
    }

    // default to grass
    return GameEngine.mapts[tileset][0];
};

self.mapRender = function (mapdata, offsetx, offsety) {
    var i, x, y, z, left, top, layerBase, layerPrimary, layerEdgeCorners, defBase, defPrimary, tsBase, tsPrimary;
    if (mapdata === false) {
        mapdata = this.mapdata;
    } else {
        this.mapdata = mapdata;
        GameEngine.mapRenderLight(GameEngine.maproom);
    }
    if (offsetx === undefined) { offsetx = GameEngine.mapoffsetx; }
    if (offsety === undefined) { offsety = GameEngine.mapoffsety; }
    GameEngine.mapoffsetx = offsetx;
    GameEngine.mapoffsety = offsety;
    // clear canvas
    GameEngine.mapctx.clearRect(0, 0, GameEngine.mapcv.width, GameEngine.mapcv.height);
    // draw rooms
    for (i = 0; i < mapdata.length; i++) {
        x = parseInt(mapdata[i].x, 10);
        y = parseInt(mapdata[i].y, 10);
        z = parseInt(mapdata[i].z, 10);
        if (z !== GameEngine.mapz) { continue; } // skip
        left = (x * 32) + offsetx;
        top = (y * 32) + offsety;
        // only render within viewport
        if (left > -32 && left < 255 && top > -32 && top < 255) {
            layerBase = mapdata[i].terrain.split(' ')[0];
            layerPrimary = mapdata[i].terrain.split(' ')[1];
            layerEdgeCorners = mapdata[i].terrain.split(' ')[2];

            defBase = GameEngine.mapGetTilesetDefinition(layerBase);
            defPrimary = GameEngine.mapGetTilesetDefinition(layerPrimary);

            tsBase = layerBase.split('.')[0];
            tsPrimary = layerPrimary.split('.')[0];

            // render primary
            GameEngine.mapctx.globalCompositeOperation = 'source-over';
            GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.sx, defPrimary.sy, 32, 32, left, top, 32, 32);

            // render edges and corners
            GameEngine.mapctx.globalCompositeOperation = 'destination-out';
            if (layerEdgeCorners.substr(0, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeTop, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(1, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeRight, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(2, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeBottom, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(3, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.edgeLeft, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(4, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerTopLeft, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(5, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerTopRight, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(6, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerBottomRight, defPrimary.sy, 32, 32, left, top, 32, 32); }
            if (layerEdgeCorners.substr(7, 1) === '1') { GameEngine.mapctx.drawImage(GameEngine.maptileset[tsPrimary], defPrimary.cornerBottomLeft, defPrimary.sy, 32, 32, left, top, 32, 32); }

            // render base
            GameEngine.mapctx.globalCompositeOperation = 'destination-over';
            GameEngine.mapctx.drawImage(GameEngine.maptileset[tsBase], defBase.sx, defBase.sy, 32, 32, left, top, 32, 32);
        }
    }
    // redraw editor (if open)
    if ($('#editor-container').css('display') !== 'none') {
        GameEngine.editorRender(false);
    }
};

self.mapGridAt = function (x, y, z) {
    var i, nX, nY, nZ, mapX, mapY, mapZ;
    nX = Number(x);
    nY = Number(y);
    nZ = Number(z);

    if (!this.mapdata) { return; }
    for  (i = 0; i < this.mapdata.length; i++) {
        mapX = Number(this.mapdata[i].x);
        mapY = Number(this.mapdata[i].y);
        mapZ = Number(this.mapdata[i].z);
        if (mapX === nX && mapY === nY && mapZ === nZ) { return this.mapdata[i]; }
    }
    return false;
};

self.mapPosition = function (x, y, z, anim) {
    if (!this.mapdata) { console.log('GameEngine.mapPosition(' + x + ', ' + y + ', ' + z + '): failed - local map cache empty'); return; }
    if (!this.mapGridAt(x, y, z)) { console.log('GameEngine.mapPosition(' + x + ', ' + y + ', ' + z + '): failed - destination doesnt exist in local map cache'); return; }
    if (this.mapz !== z) {
        this.mapz = z; // save current floor level for renderMap
    }
    // calculate offsets
    this.mapdestoffsetx = 112 - (x * 32);
    this.mapdestoffsety = 112 - (y * 32);
    // lighting?
    this.maproom = this.mapGridAt(x, y, z);
    // use animation?
    if (anim && GameEngine.mapanim === false) {
        GameEngine.mapanim = setInterval(function () {
            var done = 0;
            // X
            if (GameEngine.mapoffsetx < GameEngine.mapdestoffsetx) {
                GameEngine.mapRender(false, (GameEngine.mapoffsetx + 1), GameEngine.mapoffsety);
            } else if (GameEngine.mapoffsetx > GameEngine.mapdestoffsetx) {
                GameEngine.mapRender(false, (GameEngine.mapoffsetx - 1), GameEngine.mapoffsety);
            } else {
                done++;
            }
            // Y
            if (GameEngine.mapoffsety < GameEngine.mapdestoffsety) {
                GameEngine.mapRender(false, GameEngine.mapoffsetx, (GameEngine.mapoffsety + 1));
            } else if (GameEngine.mapoffsety > GameEngine.mapdestoffsety) {
                GameEngine.mapRender(false, GameEngine.mapoffsetx, (GameEngine.mapoffsety - 1));
            } else {
                done++;
            }
            // Animation complete?
            if (done === 2) {
                clearInterval(GameEngine.mapanim);
                GameEngine.mapanim = false;
            } else {
                GameEngine.mapRenderLight(GameEngine.maproom);
            }
        }, 1);
    } else {
        GameEngine.mapRender(false, this.mapdestoffsetx, this.mapdestoffsety);
        GameEngine.mapRenderLight(GameEngine.maproom);
    }
};

self.mapRenderLight = function (room) {
    if (room.env === 'underground') {
        GameEngine.mapLightRadius(0.3, '20,20,1');
    }
};

self.mapLightRadius = function (radius, color) {
    GameEngine.mapctx.beginPath();
    var rad = GameEngine.mapctx.createRadialGradient(120, 120, 1, 120, 120, 240);
    rad.addColorStop(0, 'rgba(' + color + ',0)');
    rad.addColorStop(radius, 'rgba(' + color + ',1)');
    GameEngine.mapctx.fillStyle = rad;
    GameEngine.mapctx.arc(120, 120, 240, 0, Math.PI * 2, false);
    GameEngine.mapctx.fill();
};
