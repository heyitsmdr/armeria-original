var self = GameEngine;

self.tilesets = [];         // Tilesets
self.mapts = [];            // Tile Properties
self.maptextures = [];		// Tile Textures / Images

self.setupTileset = function () {
	// Tilesets
    self.tilesets = ['floors'];
    /* NOTE: Edges are automatically calculated since they will always be
             to the left of the tile (if edges = true). */

	// For Animation: animStartX, animStartY, animEndX, animEndY

    self.mapts.floors = {
        "grass": {sx: 15, sy: 0, edges: true, anim: false},
        "dirt": {sx: 15, sy: 1, edges: true, anim: false}
    };

    // Texture Sources
    self.maptextures.floors = { src: "floors.png" };

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
		Object.keys(self.mapts['floors']).forEach(function(tile) {
			this[tile].sx *= 32;
			this[tile].sy *= 32;
		}, self.mapts['floors']);
	});
};

self.initTextures = function() {
	self.tilesets.forEach(function(ts) {
		self.mapts[ts].baseTexture = PIXI.BaseTexture.fromImage('images/tiles/' + self.maptextures[ts].src);
		Object.keys(self.mapts[ts]).forEach(function(tile) {
			// set main (loading from cache since these were loaded with AssetLoader)
			self.mapts[ts][tile].texture = new PIXI.Texture(self.mapts[ts].baseTexture, new PIXI.Rectangle(self.mapts[ts][tile].sx, self.mapts[ts][tile].sy, 32, 32));

			// set edges
			var edges = ['t','r','tr','b','tb','rb','trb','l','tl','rl','dtrl','bl','tbl','rbl','trbl'];
			var offset = 32;
			if(self.mapts[ts][tile].edges) {
				self.mapts[ts][tile].textureEdge = [];
				edges.forEach(function(e) {
					self.mapts[ts][tile].textureEdge[e] = [];
					self.mapts[ts][tile].textureEdge[e].texture = new PIXI.Texture(self.mapts[ts].baseTexture, new PIXI.Rectangle(self.mapts[ts][tile].sx - offset, self.mapts[ts][tile].sy, 32, 32));
					offset += 32;
				});
			}
		});
	});
	console.log('pixi: textures loaded!');
};