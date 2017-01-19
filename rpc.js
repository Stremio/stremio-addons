var url = require("url");
var extend = require("extend");

var http = require("http");
var https = require("https");

var LENGTH_TO_FORCE_POST=8192;

var receiveJSON = function(resp, callback) {
	if (resp.method == "GET") {
		var body = url.parse(resp.url, true).query.b;
		try { body = JSON.parse(new Buffer(body, "base64").toString()) } catch(e) { return callback(e) };
		return callback(null, body);
	}

	var body = [];
	resp.on("data", function(b) { body.push(b) });
	resp.on("end", function() {
		try { body = JSON.parse(Buffer.concat(body).toString()) } catch(e) { return callback(e) }
		callback(null, body);
	});
};

// Utility for JSON-RPC
// Rationales in our own client
// 1) have more control over the process, be able to implement debounced batching
// 2) reduce number of dependencies
function rpcClient(endpoint, options, globalOpts)
{
	var isGet = true;

	var client = { };
	client.request = function(method, params, callback) { 
		params[0] = null; // OBSOLETE work around authentication (index 0) slot which was used before

		var body = JSON.stringify({ params: params, method: method, id: 1, jsonrpc: "2.0" });

		if (body.length>=LENGTH_TO_FORCE_POST) isGet = false;

		var reqObj = { };
		if (!isGet) extend(reqObj, url.parse(endpoint), { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": body.length } });
		else extend(reqObj, url.parse(endpoint+"/q.json?b="+new Buffer(body, "binary").toString("base64")));
		
		if (globalOpts.disableHttps) reqObj.protocol = "http:";

		var timedOut = false

		var req = ( reqObj.protocol==="https:" ?  https : http).request(reqObj, function(res) {
			if (timedOut) return;

			if (options.respTimeout && res.setTimeout) res.setTimeout(options.respTimeout);

			receiveJSON(res, function(err, body) {
				if (err) return callback(err);
				if (!body) return callback(null, new Error("no body"));
				if (body.error) return callback(null, body.error);
				callback(null, null, body.result);
			});
		});

		if (options.timeout && req.setTimeout) req.setTimeout(options.timeout);
		req.on("error", function(err) { callback(err) });
		req.on("timeout", function() {
			timedOut = true;
			req.removeAllListeners("data");
			req.emit("close");
			callback(new Error("rpc request timed out"));
		});
		if (! isGet) req.write(body);
		req.end();
	};
	return client;
};

module.exports = rpcClient;
module.exports.receiveJSON = receiveJSON;
