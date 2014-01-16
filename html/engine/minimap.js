var self = GameEngine;

self.mapstage = false;      // Pixi Stage for Minimap
self.maprenderer = false;   // Pixi Renderer
self.mapcontainer = false;  // Pixi DisplayObjectContainer
self.mapdata = false;       // Entire minimap data
self.destinationX = 0;      // New Player X (for animation)
self.destinationY = 0;      // New Player Y (for animation)

self.mapz = 0;              // Map Z-Coordinate
self.maproom = false;       // Object within this.mapdata that contains the current room
self.mapctx = false;        // Minimap Canvas 2D Context
self.mapcv = false;         // Minimap Canvas
self.mapanim = false;       // Map Animation for setInterval
self.mapoffsetx = 0;        // Minimap offset - x
self.mapoffsety = 0;        // Minimap offset - y
self.mapdestoffsetx = 0;    // Minimap destination offset - x
self.mapdestoffsety = 0;    // Minimap destination offset - y
self.mapmarker = false;     // Image of Map Marker

self.initMinimap = function() {
    // set up tileset
    self.setupTileset();
    // set up stage
    self.mapstage = new PIXI.Stage(0x262626);
    self.maprenderer = PIXI.autoDetectRenderer(256, 256);
    // append to game
    document.getElementById('map-canvas').appendChild(self.maprenderer.view);
    // start rendering
    requestAnimFrame(self.pixiRender);
    // init container
    self.mapcontainer = new PIXI.DisplayObjectContainer();
    // add to stage
    self.mapstage.addChild(self.mapcontainer);

    console.log('pixi: stage initiated');
};

self.mmTest = function(x, y) {
    // load texture
    var floor_grass = self.mapts['floors']['grass'].texture;

    floor_grass.setFrame(new PIXI.Rectangle(32, 32, 32, 32));

    var room = new PIXI.Sprite(floor_grass);

    room.position.x = x;
    room.position.y = y;

    // add to container
    self.mapcontainer.addChild(room);
}

self.pixiRender = function() {
    requestAnimFrame(self.pixiRender);

    // animate moving?
    if(self.destinationX > self.mapcontainer.position.x)
        self.mapcontainer.position.x += 4;
    else if(self.destinationX < self.mapcontainer.position.x)
        self.mapcontainer.position.x -= 4;

    if(self.destinationY > self.mapcontainer.position.y)
        self.mapcontainer.position.y += 4;
    else if(self.destinationY < self.mapcontainer.position.y)
        self.mapcontainer.position.y -= 4;

    self.maprenderer.render(self.mapstage);
}

// mapdata = [{x, y, z, terrain, env}];
self.mapRender = function(mapdata, z) {
    // load or restore map data
    if (mapdata === false) {
        mapdata = this.mapdata;
    } else {
        this.mapdata = mapdata;
    }

    // check z
    if(z === undefined) { z = 0; }

    // clear current stage
    self.mapcontainer.children.forEach(function(child) {
        self.mapcontainer.removeChild(child);
    });

    mapdata.forEach(function(room) {
        var tileBase = room.terrain.split(' ')[0];
        var tilePrimary = room.terrain.split(' ')[1];
        var tileEdges = room.terrain.split(' ')[2];

        var tileBaseSheet = tileBase.split('.')[0];
        var tileBaseTile = tileBase.split('.')[1];
        var tilePrimarySheet = tilePrimary.split('.')[0];
        var tilePrimaryTile = tilePrimary.split('.')[1];

        if(room.z == z) {
            var spriteRoom = new PIXI.DisplayObjectContainer();

            if(tileBase != "null") {
                var base = new PIXI.Sprite(self.mapts[tileBaseSheet][tileBaseTile].texture);
                base.position.x = room.x * 32;
                base.position.y = room.y * 32;
                spriteRoom.addChild(base);
            }
            
            if(tilePrimary != "null") {
                var primary = new PIXI.Sprite(self.getPrimaryTextureWithEdges(tilePrimarySheet, tilePrimaryTile, tileEdges.substr(0, 4)));
                primary.position.x = room.x * 32;
                primary.position.y = room.y * 32;
                spriteRoom.addChild(primary);
            }


            self.mapcontainer.addChild(spriteRoom);
        }
    });
}

self.mapPosition = function(x, y, z, anim) {
    if(!anim) {
        self.mapcontainer.position.x = -(x * 32) + 112;
        self.mapcontainer.position.y = -(y * 32) + 112;
        self.destinationX = self.mapcontainer.position.x;
        self.destinationY = self.mapcontainer.position.y;
    } else {
        self.destinationX = -(x * 32) + 112;
        self.destinationY = -(y * 32) + 112;
    }
};

self.getPrimaryTextureWithEdges = function(sheet, tile, edgeData) {
    var edges = ((edgeData.substr(0,1)=='1')?'t':'') +
                ((edgeData.substr(1,1)=='1')?'r':'') +
                ((edgeData.substr(2,1)=='1')?'b':'') +
                ((edgeData.substr(3,1)=='1')?'l':'');

    if(edges) {
        return self.mapts[sheet][tile].textureEdge[edges].texture;
    } else {
        return self.mapts[sheet][tile].texture;
    }
};

self._mapRender = function (mapdata, offsetx, offsety) {
    var i, x, y, z, left, top, layerBase, layerPrimary, layerEdgeCorners, defBase, defPrimary, tsBase, tsPrimary;
    if (mapdata === false) {
        mapdata = this.mapdata;
    } else {
        this.mapdata = mapdata;
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

self._mapPosition = function (x, y, z, anim) {
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
