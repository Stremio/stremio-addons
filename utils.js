var http;
try { http = require("stream-http"); } catch(e) { http = require("http") };
module.exports.http = http;

module.exports.receiveJSON = function(resp, callback) {
	var body = [];
	resp.on("data", function(b) { body.push(b) });
	resp.on("end", function() {
		try { body = JSON.parse(Buffer.concat(body).toString()) } catch(e) { return callback(e) }
		callback(null, body);
	});
};

module.exports.genID = function() { 
	return Math.round(Math.random() * Math.pow(2, 24)) 
};