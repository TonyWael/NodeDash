/*
Dashboard client
For use with node.js
*/

var path = require('path');
var io = require('socket.io-client');
var os = require('os');
var osutils = require('os-utils');
var socket;

var DEBUG = false;
var hostname = "";

var setDebug = function(debug) {
	DEBUG = debug;
};

var connect = function(host, port, specifiedHostname, callback) {
	socket = io.connect(host, {
		port: port
	});

	if(!specifiedHostname) {
		hostname = os.hostname() + " [" + module.parent.filename + "]";
		hostname = hostname.replace(path.dirname(module.parent.filename) + "/", "");
	} else {
		hostname = specifiedHostname;
	}

	log("[DASHCLIENT] Starting dashboard client...");
	log("[DASHCLIENT] Connecting to " + host + ":" + port);
	log("[DASHCLIENT] Hostname: " + hostname);	


	socket.on('connect', function () { 
		log("[DASHCLIENT] Socket connected"); 
		socket.on('identify', function() {
			socket.emit('identify', { what: "server", hostname: hostname });
		});
		callback();
	});
};

var sendStats = function(extraData) {
	osutils.cpuUsage(function(cpu) {
		cpu = Math.round(cpu * 100);

		var json =	{ 
						hostname: hostname, 
						cpu: cpu, 
						freemem: osutils.freemem(), 
						totalmem: osutils.totalmem(), 
						events_per_second: 0,
						active_processes: "5"
					};

		if(extraData) {
			json.extraData = extraData;
		}

		socket.emit('stats', json);
		if(extraData)
			log("[DASHCLIENT] Sending stats... (extra data: " + extraData + ")");
		else
			log("[DASHCLIENT] Sending stats... ");
	});
};

var sendStatsAutomatically = function(delay, extraData) {
	sendStats(extraData);
	setTimeout(	function() { 
					sendStatsAutomatically(delay, extraData); 
				}, delay);
};

function log(logText) {
	if(DEBUG) {
		console.log(logText);
	}
}

var server = function(port) {
	var io = require('socket.io').listen(port);

	var clients = [];
	var servers = [];

	io.sockets.on('connection', function (socket) {
	  // Who are you?
	  socket.emit('identify', {});

	  socket.on('identify', function (data) {
	  	if(data.what == "server") {
	  		console.log("A server registered with name: " + data.hostname);
	  		servers.push(data.hostname);
	  	}
	  	if(data.what == "client") {
	  		console.log("A client registered with id: " + socket.id);
	  		// So now we know who to send all the data to.
	  		clients.push(socket.id);
	  	}
	  });

		socket.on('stats', function(data) {
			// Received server data. Pipe through to client(s)
			console.log("Got stats: " + data);
			for (var i = 0; i < clients.length; i++) {
				io.sockets.socket(clients[i]).emit('stats', { stats: data });
			};
		});
	});
};


/*
	Exports
*/

exports.setDebug				= setDebug;
exports.connect					= connect;
exports.sendStats				= sendStats;
exports.sendStatsAutomatically	= sendStatsAutomatically;
exports.server					= server;