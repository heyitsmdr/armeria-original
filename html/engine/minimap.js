var self = GameEngine;

self.mapstage = false;      // Pixi Stage for Minimap
self.maprenderer = false;   // Pixi Renderer
self.mapcontainer = false;  // Pixi DisplayObjectContainer
self.mapdata = false;       // Entire minimap data
self.destinationX = 0;      // New Player X (for animation)
self.destinationY = 0;      // New Player Y (for animation)
self.maproom = false;       // Object within this.mapdata that contains the current room

self.mapz = 0;              // Map Z-Coordinate
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

self.pixiRender = function() {
    requestAnimFrame(self.pixiRender);

    // editor rendering
    self.editorPixiRender();
    
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

    // re-render editor if running
    if ($('#editor-container').css('display') !== 'none') {
        GameEngine.editorRender();
    }
}

self.mapPosition = function(x, y, z, anim) {
    if(!self.maproom || self.maproom.z != z)
        self.mapRender(false, z);
    
    if(!anim) {
        self.mapcontainer.position.x = -(x * 32) + 112;
        self.mapcontainer.position.y = -(y * 32) + 112;
        self.destinationX = self.mapcontainer.position.x;
        self.destinationY = self.mapcontainer.position.y;
    } else {
        self.destinationX = -(x * 32) + 112;
        self.destinationY = -(y * 32) + 112;
    }
    self.maproom = self.mapGridAt(x, y, z);

    // re-render editor if running
    if ($('#editor-container').css('display') !== 'none') {
        GameEngine.editorRender();
        GameEngine.socket.emit('cmd', {cmd: 'edit refresh'});
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
