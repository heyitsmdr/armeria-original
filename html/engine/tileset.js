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

    self.mapts.floors = [
        {def: 'grass', sx: 15, sy: 0, edges: true, anim: false},
        {def: 'dirt', sx: 15, sy: 1, edges: true, anim: false}
    ];

    // Texture Sources
    self.maptextures.floors = { src: "temp-floors.png" };

    // Calculate Real Sx and Sy
    self.calculateRealSxSy();
    // Calculate Edges
    self.calculateEdges();
    // Load Textures
  	self.loadTextures();
};

self.calculateRealSxSy = function () {
	self.tilesets.forEach(function(ts) {
		self.mapts[ts].forEach(function(tile) {
			tile.sx *= 32;
			tile.sy *= 32;
		});
	});
};

self.calculateEdges = function() {
	self.tilesets.forEach(function(ts) {
		self.mapts[ts].forEach(function(tile) {
			if(tile.edges) {
				tile.edgeT = tile.sx - 32;
				tile.edgeR = tile.sx - 64;
				tile.edgeTR = tile.sx - 96;
				tile.edgeB = tile.sx - 128;
				tile.edgeTB = tile.sx - 160;
				tile.edgeRB = tile.sx - 192;
				tile.edgeTRB = tile.sx - 224;
				tile.edgeL = tile.sx - 256;
				tile.edgeTL = tile.sx - 288;
				tile.edgeRL = tile.sx - 320;
				tile.edgeTRL = tile.sx - 352;
				tile.edgeBL = tile.sx - 384;
				tile.edgeTBL = tile.sx - 416;
				tile.edgeRBL = tile.sx - 448;
				tile.edgeTRBL = tile.sx - 480;
			}
		});
	});
};

self.loadTextures = function() {
	self.tilesets.forEach(function(ts) {
		self.maptextures[ts].txt = PIXI.Texture.fromImage('images/tiles/' + self.maptextures[ts].src);
	});
};