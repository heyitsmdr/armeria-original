// connect to server

var io = false;
var socket = false;

exports.setUpSocket = function(test) {
	io = require('socket.io-client');

	test.done();
};

exports.connectToServer = function(test) {
	socket = io.connect('localhost', { port: 2772 });

	socket.on('connect', function () {
		test.ok(true);
		test.done();
	});

	socket.on('error', function (err) {
		test.ok(false, 'could not connect to localhost:2772');
		test.done();
	});
};

exports.existingCharacter = {
	logIn: function(test) {
		// emit login
		socket.emit('login', {
            version: false, // skip version check
            name: "Mike DuRussel",
            password: 'l3tm3in'
        });
		// check if logged in
		
        test.done();
	}
};