var self = GameEngine;
self.Space = {};

self.Space.moving = false;			// Boolean
self.Space.movingDir = 'n';			// String
self.Space.movingAccel = 0.225;		// Integer
self.Space.movingTimer = false;		// Timer
self.Space.movingSpeed = 0;			// Integer
self.Space.moveToX = 0;				// Integer
self.Space.moveToY = 0;				// Integer
self.Space.updateTimer = false;		// Timer
self.Space.maxSpeed = 5;			// Integer
self.Space.spacestage = false;		// Pixi Stage
self.Space.spacerenderer = false;	// Pixi Renderer
self.Space.spacebackdrop = false;	// Pixi Container
self.Space.coordinates = false; 	// Pixi Text
self.Space.ship = false;			// Pixi Sprite
self.Space.continueRendering = true;// Boolean
self.Space.inDockRange = false;		// Boolean
self.Space.layers = {
	backgroundOne: false,			// Pixi DisplayObjectContainer (Slowest)
	backgroundTwo: false,			// Pixi DisplayObjectContainer (Slow)
	fogLayer: false,				// Pixi DisplayObjectContainer (Fast)
	starsLayer: false				// Pixi DisplayObjectContainer (Fastest)
};
self.Space.properties = {
	sector: 'A1',
	slowest: [{
		ts: 'planet',
		tile: 'planet',
		x: 0,
		y: 0,
		name: 'Planet Armeria'
	}]
};
self.Space.location = { x: 0, y: 0 };

self.Space.engineInit = function() {
	// bind to window
	$( window ).resize(function() {
		if($('#game').data('inspace') !== 'true')
			return;
		// resize
		self.Space.spacerenderer.resize($("#space").width(), $("#space").height());
		// move ship
		self.Space.ship.position.x = (self.Space.spacerenderer.width / 2) - (self.Space.ship.width / 2);
		self.Space.ship.position.y = (self.Space.spacerenderer.height / 2) - (self.Space.ship.height / 2);
		// re-init sector
		self.Space.initSector();
	});
	// bind to keys
	$( document ).keyup(function (e) {
        if($('#game').data('inspace') !== 'true')
            return;

        switch (e.which) {
            case 37:
            case 38:
            case 39:
            case 40:
                GameEngine.Space.travelStop();
                break;
        }
    });
	$( document ).keydown(function (e) {
        if($('#game').data('inspace') !== 'true')
            return;

        switch (e.which) {
            case 37:
            	GameEngine.Space.travelGo('w');
            	break;
            case 38:
            	GameEngine.Space.travelGo('n');
            	break;
            case 39:
            	GameEngine.Space.travelGo('e');
            	break;
            case 40:
            	GameEngine.Space.travelGo('s');
            	break;
        }
    });
};

self.Space.toggleSpace = function() {
	if($('#game').data('inspace') === 'true') {
		// reposition text area
		$('#game').removeClass('spacebg');
		$('#game').css('top', '5px');
		$('#game').css('right', '5px');
		$('#game').css('height', 'auto');
		$('#game').css('width', 'auto');
		$('#game').data('inspace', 'false');
		$('#space').hide();

		self.Space.continueRendering = false;
	} else {
		// reposition text area
		$('#game').addClass('spacebg');
		$('#game').css('top', 'auto');
		$('#game').css('right', 'auto');
		$('#game').css('height', '20%');
		$('#game').css('width', '50%');
		$('#game').data('inspace', 'true');
		$('#space').show();

		// init and start rendering
		if($('#space').data('initialized') != 'true') {
      		self.Space.initStage();
      		self.Space.initSector();
		}
      	else{
      		self.Space.continueRendering = true;
      		self.Space.initSector();
      		requestAnimFrame(self.Space.spaceRender);
      	}
	}
	
};

self.Space.initStage = function(skip) {
	self.Space.spacestage = new PIXI.Stage(0x000000);
	self.Space.spacerenderer = PIXI.autoDetectRenderer($("#space").width(), $("#space").height());

	document.getElementById('space').appendChild(self.Space.spacerenderer.view);
	$('#space').data('initialized', 'true');

	// start rendering
	requestAnimFrame(self.Space.spaceRender);

    // add backdrop
    var backdrop = new PIXI.TilingSprite(self.mapts['spacebg']['bg'].texture, self.Space.spacerenderer.width, self.Space.spacerenderer.height);
    self.Space.spacestage.addChild(backdrop);

    // set up layers
    self.Space.layers.backgroundOne = new PIXI.DisplayObjectContainer();
    self.Space.layers.backgroundTwo = new PIXI.DisplayObjectContainer();
    self.Space.layers.starsLayer = new PIXI.DisplayObjectContainer();
    self.Space.layers.fogLayer = new PIXI.DisplayObjectContainer();
    self.Space.spacestage.addChild(self.Space.layers.backgroundOne);
    self.Space.spacestage.addChild(self.Space.layers.backgroundTwo);
    self.Space.spacestage.addChild(self.Space.layers.starsLayer);
    self.Space.spacestage.addChild(self.Space.layers.fogLayer);

    // add stars
    var stars = new PIXI.TilingSprite(self.mapts['stars']['stars'].texture, 9000, 9000);
    stars.position.x = -4500;
    stars.position.y = -4500;
    self.Space.layers.starsLayer.addChild(stars);

    // add fog
    /*var fog = new PIXI.TilingSprite(self.mapts['fog']['fog'].texture, 9000, 9000);
    fog.position.x = -4500;
    fog.position.y = -4500;
    self.Space.layers.fogLayer.addChild(fog); */

    // add coordinates
    self.Space.coordinates = new PIXI.Text('Status Text', {font: '12px Tahoma', fill: 'white'});
    self.Space.coordinates.position.x = 5;
    self.Space.coordinates.position.y = 5;
    self.Space.spacestage.addChild(self.Space.coordinates);

    // add ship & center ship
	self.Space.ship = new PIXI.Sprite(self.mapts['space']['ship'].texture);
	self.Space.ship.position.x = (self.Space.spacerenderer.width / 2) - (self.Space.ship.width / 2);
	self.Space.ship.position.y = (self.Space.spacerenderer.height / 2) - (self.Space.ship.height / 2);
	self.Space.ship.anchor.x = 0.5;
	self.Space.ship.anchor.y = 0.5;
	self.Space.spacestage.addChild(self.Space.ship);
};

self.Space.initSector = function() {
	for(var i = self.Space.layers.backgroundOne.children.length - 1; i >= 0; i--) {
   		self.Space.layers.backgroundOne.removeChild(self.Space.layers.backgroundOne.children[i]);
   	}
   	for(var i = self.Space.layers.backgroundTwo.children.length - 1; i >= 0; i--) {
   		self.Space.layers.backgroundTwo.removeChild(self.Space.layers.backgroundTwo.children[i]);
   	}

	self.Space.properties.slowest.forEach(function(prop){
		// add sprite
		var _sprite = new PIXI.Sprite(self.mapts[prop.ts][prop.tile].texture);
		_sprite.position.x = prop.x + (self.Space.spacerenderer.width / 2);
		_sprite.position.y = prop.y + (self.Space.spacerenderer.height / 2);
		self.Space.layers.backgroundOne.addChild(_sprite);
		// set height and width
		prop.height = _sprite.texture.height;
		prop.width = _sprite.texture.width;
		// name?
		if(prop.name) {
			prop.text = new PIXI.Text(prop.name, {font: '16px Tahoma', fill: 'white'});
			prop.text.position.x = _sprite.position.x + (self.mapts[prop.ts][prop.tile].texture.width / 2) - (prop.text.width / 2);
			prop.text.position.y = _sprite.position.y + (self.mapts[prop.ts][prop.tile].texture.height / 2) - (prop.text.height / 2);
			self.Space.layers.backgroundOne.addChild(prop.text);
		}
	});
};

self.Space.spaceRender = function() {
	if(self.Space.continueRendering)
		requestAnimFrame(self.Space.spaceRender);

	// update mouse position
	var mpos = self.Space.spacestage.getMousePosition();
	self.Space.coordinates.setText('Sector ' + self.Space.properties.sector + '\nStage Coordinates: ' + mpos.x + ', ' + mpos.y + '\nSpace Position: ' + self.Space.location.x + ', ' + self.Space.location.y);

	self.Space.spacerenderer.render(self.Space.spacestage);
};

self.Space.moveTo = function(x, y) {
	// orientation
	var dx = (x - self.Space.location.x);
	var dy = -(y - self.Space.location.y);
	self.Space.ship.rotation = Math.atan2(dx, dy);

	// begin move
	self.Space.moveToX = x;
	self.Space.moveToY = y;
	clearInterval(self.Space.movingTimer);
	self.Space.movingTimer = setInterval(function(){
		// accelerate?
		if(self.Space.movingSpeed < self.Space.maxSpeed)
			self.Space.movingSpeed += self.Space.movingAccel;
		if(self.Space.movingSpeed > self.Space.maxSpeed)
			self.Space.movingSpeed = self.Space.maxSpeed;

		// reached destination?
		if(self.Space.location.x == self.Space.moveToX && self.Space.location.y == self.Space.moveToY) {
			self.Space.movingSpeed = 0;
			clearInterval(self.Space.movingTimer);
			return;
		}

		// move
		
	}, 20);

	self.Space.setSpacePosition(x, y);
};

self.Space.setSpacePosition = function(x, y) {
	// delta
	var dx = Math.abs(x - self.Space.location.x);
	var dy = Math.abs(y - self.Space.location.y);

	// save
	self.Space.location.x = x;
	self.Space.location.y = y;

	// move layers
	self.Space.layers.backgroundOne.position.x = -self.Space.location.x * 0.25;
	self.Space.layers.backgroundOne.position.y = -self.Space.location.y * 0.25;
	self.Space.layers.backgroundTwo.position.x = -self.Space.location.x * 0.50;
	self.Space.layers.backgroundTwo.position.y = -self.Space.location.y * 0.50;
	self.Space.layers.fogLayer.position.x = -self.Space.location.x * 0.75;
	self.Space.layers.fogLayer.position.y = -self.Space.location.y * 0.75;
	self.Space.layers.starsLayer.position.x = -self.Space.location.x * 1;
	self.Space.layers.starsLayer.position.y = -self.Space.location.y * 1;

	// post-move check
	self.Space.postMoveCheck();
};

self.Space.travelStop = function() {
	self.Space.moving = false;
	clearInterval(self.Space.movingTimer);

	self.Space.movingTimer = setInterval(function(){
		// decelerate
		if(self.Space.movingSpeed > 0)
			self.Space.movingSpeed -= self.Space.movingAccel;
		if(self.Space.movingSpeed < 0)
			self.Space.movingSpeed = 0;

		// done?
		if(self.Space.movingSpeed == 0) {
			self.Space.updateServerLocation();
			clearInterval(self.Space.movingTimer);
			clearInterval(self.Space.updateTimer);
		}

		// move
		switch(self.Space.movingDir) {
			case 'n':
				self.Space.ship.rotation = 0;
				self.Space.setSpacePosition( self.Space.location.x , self.Space.location.y - self.Space.movingSpeed );
				break;
			case 's':
				self.Space.ship.rotation = (180 * Math.PI / 180);
				self.Space.setSpacePosition( self.Space.location.x , self.Space.location.y + self.Space.movingSpeed );
				break;
			case 'e':
				self.Space.ship.rotation = (90 * Math.PI / 180);
				self.Space.setSpacePosition( self.Space.location.x + self.Space.movingSpeed, self.Space.location.y );
				break;
			case 'w':
				self.Space.ship.rotation = (270 * Math.PI / 180);
				self.Space.setSpacePosition( self.Space.location.x - self.Space.movingSpeed , self.Space.location.y );
				break;
		}
	}, 20);
};

self.Space.travelGo = function(dir) {
	if(!self.Space.moving) {
		self.Space.moving = true;
		self.Space.movingDir = dir;

		clearInterval(self.Space.movingTimer);
		clearInterval(self.Space.updateTimer);
		self.Space.movingTimer = setInterval(function(){
			// accelerate?
			if(self.Space.movingSpeed < self.Space.maxSpeed)
				self.Space.movingSpeed += self.Space.movingAccel;
			if(self.Space.movingSpeed > self.Space.maxSpeed)
				self.Space.movingSpeed = self.Space.maxSpeed;

			// move
			switch(self.Space.movingDir) {
				case 'n':
					self.Space.ship.rotation = 0;
					self.Space.setSpacePosition( self.Space.location.x , self.Space.location.y - self.Space.movingSpeed );
					break;
				case 's':
					self.Space.ship.rotation = (180 * Math.PI / 180);
					self.Space.setSpacePosition( self.Space.location.x , self.Space.location.y + self.Space.movingSpeed );
					break;
				case 'e':
					self.Space.ship.rotation = (90 * Math.PI / 180);
					self.Space.setSpacePosition( self.Space.location.x + self.Space.movingSpeed, self.Space.location.y );
					break;
				case 'w':
					self.Space.ship.rotation = (270 * Math.PI / 180);
					self.Space.setSpacePosition( self.Space.location.x - self.Space.movingSpeed , self.Space.location.y );
					break;
			}
		}, 20);

		self.Space.updateTimer = setInterval(self.Space.updateServerLocation, 1000);
	}
};

self.Space.updateServerLocation = function() {
	GameEngine.socket.emit('spaceupdt', {
		x: GameEngine.Space.location.x,
		y: GameEngine.Space.location.y
	});
};

self.Space.postMoveCheck = function() {
	// within a planets landing area?
	/*self.Space.properties.slowest.forEach(function(prop){
		if(self.Space.location.x > prop.x && self.Space.location.x < (prop.x + prop.width) && self.Space.location.y > prop.y && self.Space.location.y < (prop.y + prop.height) && !self.Space.inDockRange) {
			prop.text.setText(prop.name + '\n(Ready to Dock)');
		} else {
			prop.text.setText(prop.name);
		}
	});*/
};


self.Space.engineInit();