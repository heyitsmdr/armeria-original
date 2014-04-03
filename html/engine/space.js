var self = GameEngine;
self.Space = {};

self.Space.spacestage = false;		// Pixi Stage
self.Space.spacerenderer = false;	// Pixi Renderer
self.Space.spacecontainer = false;	// Pixi Container
self.Space.continueRendering = true;

self.Space.toggleSpace = function() {
	if($('#game').data('inspace') === 'true') {
		// reposition text area
		$('#game').css('top', '5px');
		$('#game').css('right', '5px');
		$('#game').css('height', 'auto');
		$('#game').css('width', 'auto');
		$('#game').data('inspace', 'false');
		$('#space').hide();

		self.Space.continueRendering = false;
		
		// show minimap
		$('div.showhide,#minimap-show').hide();
      	$('div.showhide,#minimap').show(200, function(){$('div.showhide,#minimap-hide').fadeIn(300);});
	} else {
		// reposition text area
		$('#game').css('top', 'auto');
		$('#game').css('right', 'auto');
		$('#game').css('height', '20%');
		$('#game').css('width', '50%');
		$('#game').data('inspace', 'true');
		$('#space').show();

		// hide minimap
		$('div.showhide,#minimap-hide').hide();
		$('div.showhide,#minimap').hide(200, function(){$('div.showhide,#minimap-show').fadeIn(300);});

		// init and start rendering
		if($('#space').data('initialized') != 'true')
      		self.Space.initStage();
      	else{
      		self.Space.continueRendering = true;
      		requestAnimFrame(self.Space.spaceRender);
      	}
	}
	
};

self.Space.initStage = function() {
	self.Space.spacestage = new PIXI.Stage(0x262626);
	self.Space.spacerenderer = PIXI.autoDetectRenderer($("#space").width(), $("#space").height());

	document.getElementById('space').appendChild(self.Space.spacerenderer.view);
	$('#space').data('initialized', 'true');

	// start rendering
	requestAnimFrame(self.Space.spaceRender);

	// init container
    self.Space.spacecontainer = new PIXI.DisplayObjectContainer();

    // add to stage
    self.Space.spacestage.addChild(self.Space.spacecontainer);

    // add ship
	var ship = new PIXI.Sprite(self.mapts['space']['ship'].texture);
	ship.position.x = 100;
	ship.position.y = 100;

	self.Space.spacecontainer.addChild(ship);
};

self.Space.spaceRender = function() {
	if(self.Space.continueRendering)
		requestAnimFrame(self.Space.spaceRender);

	self.Space.spacerenderer.render(self.Space.spacestage);
};
