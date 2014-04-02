var self = GameEngine;
self.Space = {};

self.Space.toggleSpace = function() {
	if($('#game').data('inspace') === 'true') {
		// reposition text area
		$('#game').css('top', '5px');
		$('#game').css('right', '5px');
		$('#game').css('height', 'auto');
		$('#game').css('width', 'auto');
		$('#game').data('inspace', 'false');

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

		// hide minimap
		$('div.showhide,#minimap-hide').hide();
		$('div.showhide,#minimap').hide(200, function(){$('div.showhide,#minimap-show').fadeIn(300);});
	}
	
};