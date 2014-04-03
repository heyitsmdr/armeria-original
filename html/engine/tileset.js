var self = GameEngine;

self.tilesets = [];         // Tilesets
self.mapts = [];            // Tile Properties
self.maptextures = [];		// Tile Textures / Images

self.setupTileset = function () {
	// Tilesets
    self.tilesets = ['floors', 'shipFloor', 'shipObjects', 'space'];
    /* NOTE: Edges are automatically calculated since they will always be
             to the left of the tile (if edges = true). */

	// For Animation: animStartX, animStartY, animEndX, animEndY

    self.mapts.floors = {
        "grass": {sx: 15, sy: 0, edges: true, anim: false},
        "dirt": {sx: 15, sy: 1, edges: true, anim: false}
    };
    self.mapts.shipFloor = {
        "basic": {sx: 15, sy: 1, edges: true, anim: false}
    };
    self.mapts.shipObjects = {
        "computerTop": {sx: 0, sy: 0, edges: false, anim: false},
        "computerRight": {sx: 1, sy: 0, edges: false, anim: false},
        "computerBottom": {sx: 2, sy: 0, edges: false, anim: false},
        "computerLeft": {sx: 3, sy: 0, edges: false, anim: false}
    };
    self.mapts.space = {
    	"ship": {sx: 0, sy: 0, size: 80, edges: false, anim: false}
    };

    // Texture Sources
    self.maptextures.floors = { src: "floors.png" };
    self.maptextures.shipFloor = { src: "shipFloor.png" };
    self.maptextures.shipObjects = { src: "shipObjects.png" };
    self.maptextures.space = { src: "space.png" };

    // Calculate Real Sx and Sy
    self.calculateRealSxSy();
    // Load Textures
    var assetFiles = [];
    self.tilesets.forEach(function(ts) {
    	assetFiles.push('images/tiles/' + self.maptextures[ts].src);
    });
    var loader = new PIXI.AssetLoader(assetFiles);
	loader.onComplete = self.initTextures;
	loader.load();
	console.log('pixi: loading assets..');
};

self.calculateRealSxSy = function () {
	self.tilesets.forEach(function(ts) {
		Object.keys(self.mapts[ts]).forEach(function(tile) {
			this[tile].sx *= 32;
			this[tile].sy *= 32;
		}, self.mapts[ts]);
	});
};

self.initTextures = function() {
	self.tilesets.forEach(function(ts) {
		self.mapts[ts].baseTexture = PIXI.BaseTexture.fromImage('images/tiles/' + self.maptextures[ts].src);
		Object.keys(self.mapts[ts]).forEach(function(tile) {
			// set main (loading from cache since these were loaded with AssetLoader)
			self.mapts[ts][tile].texture = new PIXI.Texture(self.mapts[ts].baseTexture, new PIXI.Rectangle(self.mapts[ts][tile].sx, self.mapts[ts][tile].sy, 32, 32));

			// set edges
			var edges = ['t','r','tr','b','tb','rb','trb','l','tl','rl','trl','bl','tbl','rbl','trbl'];
			var offset = self.mapts[ts][tile].size || 32;
			if(self.mapts[ts][tile].edges) {
				self.mapts[ts][tile].textureEdge = [];
				edges.forEach(function(e) {
					self.mapts[ts][tile].textureEdge[e] = [];
					self.mapts[ts][tile].textureEdge[e].texture = new PIXI.Texture(self.mapts[ts].baseTexture, new PIXI.Rectangle(self.mapts[ts][tile].sx - offset, self.mapts[ts][tile].sy, self.mapts[ts][tile].size || 32, self.mapts[ts][tile].size || 32));
					offset += self.mapts[ts][tile].size || 32;
				});
			}
		});
	});
	console.log('pixi: textures loaded!');
};