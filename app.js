/**
 * Module dependencies.
 */
var express = require('express');
var http = require('http');
var path = require('path');
var app = express();

// Set up console log timestamps
require('console-stamp')(console, { pattern: 'yyyy-mm-dd HH:MM:ss.l Z'});

var turn_lb = require('./turn_lb');

var turn_port = 3478;

// all environments
app.set('port', 3000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

//create the server
var server = http.createServer(app).listen(app.get('port'), function () {
		console.log('TURN API INFO [ event=%s, port=%d ]', 'socket.io host http server startup',  app.get('port') );
	});

//Socket IO specifics
var intervalTime = 10000; // 10 seconds
io = require('socket.io').listen(server, {
		log : false
	});
io.sockets.on('connection', function (socket) {
	var interval = setInterval(function () {
			var turn_server_array = turn_lb.getServer_array();
			if (turn_server_array != null) {
				console.log('TURN API INFO [ event=%s, data=%s ]', 'socket.io request', JSON.stringify(turn_server_array) );
				socket.emit('dataSet', turn_server_array);
			}

		}, intervalTime);
});

////REST server
var sys = require("sys");
var my_http = require("http");
var path = require("path");
var url = require('url');
var crypto = require('crypto');
var rest_port = 8080;

my_http.createServer(function (request, response) {

	var server_array = turn_lb.getServer_array();
	//var url_parts = url.parse(request.url, true);
	//var my_path = url_parts.pathname;
	var my_path = url.parse(request.url).pathname;

	var objToJson = 'null';

	if (server_array != null) {
		
    var resObj = [];

		for (var j = 0; j < server_array.length; j++) {
      
			var tcpEntry = "turn:" + server_array[j].turn_server_ip + ":" + turn_port + "?transport=tcp";
      var udpEntry = "turn:" + server_array[j].turn_server_ip + ":" + turn_port + "?transport=udp";
      var stunEntry = "stun:" + server_array[j].turn_server_ip + ":" + turn_port;
      
      resObj.push(tcpEntry);
      resObj.push(udpEntry);
      resObj.push(stunEntry);
      
		}
    
    objToJson = JSON.stringify(resObj);
    
	}
	

	if (my_path == '/getTURNServerArray') {
    console.log('TURN API INFO [ event=%s, resourceRequest=%s, data=%s ]', 'Get TURN server list', my_path, objToJson );
    
		response.writeHead(200, {
			'Content-Length' : objToJson.length,
			'Content-Type' : 'application/json'
		});
		response.write(objToJson);
		response.end();
	}

	if (request.url.indexOf("getTURNinfo?") > -1) {
		var requestUrl = request.url;
		var url_parts = url.parse(request.url, true);
		var query = url_parts.query;
		var username_res = query.uid;

		//if(requestUrl.indexOf("getpassword?") > -1){
		var key = 'x3efs2r3kdsnvsdvs32r322poujhdue388';
		var username = username_res;

		var setExpirySecs = 3600;
		var longTime = Math.round((new Date()).getTime() / 1000);
		var timestamp = Math.round(longTime + setExpirySecs);

		var userCombo = username + ':' + timestamp;
		var iceURL = resObj;
		var hash = crypto.createHmac('sha1', key).update(userCombo).digest('base64');

		var jsonPayLoad = JSON.stringify({
				'url' : iceURL,
				'credential' : hash,
				'username' : userCombo
		});

    console.log('TURN API INFO [ event=%s, resourceRequest=%s, data=%s ]', 'Get TURN server details', my_path, jsonPayLoad );
    
		response.writeHead(200, {
			'Content-Length' : jsonPayLoad.length,
			'Content-Type' : 'application/json'
		});
		response.write(jsonPayLoad);
		response.end();

	}

}).listen(rest_port, function() {
  console.log('TURN API INFO [ event=%s, port=%d ]', 'REST host http server startup',  rest_port );
});


    