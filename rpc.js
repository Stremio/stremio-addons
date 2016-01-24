var http = require("http");
var url = require("url");
var _ = require("lodash");

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

var genID = function() { 
	return Math.round(Math.random() * Math.pow(2, 24)) 
};

// Utility for JSON-RPC
// Rationales in our own client
// 1) have more control over the process, be able to implement debounced batching
// 2) reduce number of dependencies
function rpcClient(endpoint, options)
{
	var isGet = !!endpoint.match("stremioget");

	var client = { };
	client.request = function(method, params, callback) {
		rpcRequest([{ callback: callback, params: params, method: method, id: genID(), jsonrpc: "2.0" }]);
	};
	if (!isGet) client.enqueue = function(handle, method, params, callback) {
		if (! handle.flush) handle.flush = _.debounce(function() {
			rpcRequest(handle.queue); handle.queue = [];
		}, handle.time);
		handle.queue.push({ callback: callback, params: params, method: method, id: genID(), jsonrpc: "2.0" });
		handle.flush();
	};
	function rpcRequest(requests) { // supports batching
		requests.forEach(function(x, i) { 
			x.callback = _.once(x.callback);
			if (isGet) x.params[0] = null; // get requests limited to noauth
			if (isGet) x.id = i+1; // unify ids
		});

		var body = JSON.stringify(requests.length == 1 ? requests[0] : requests);
		var byId = _.indexBy(requests, "id");
		var callbackAll = function() { var args = arguments; requests.forEach(function(x) { x.callback && x.callback.apply(null, args) }) };

		if (body.length>=LENGTH_TO_FORCE_POST) isGet = false;

		var reqObj = { };
		if (!isGet) _.extend(reqObj, url.parse(endpoint), { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": body.length } });
		else _.extend(reqObj, url.parse(endpoint+"/q.json?b="+new Buffer(body, "binary").toString("base64")));
		
		var req = http.request(reqObj, function(res) {
			if (options.respTimeout && res.setTimeout) res.setTimeout(options.respTimeout);

			receiveJSON(res, function(err, body) {
				if (err) return callbackAll(err);
				//console.log(res.headers["cf-cache-status"]);
				(Array.isArray(body) ? body : [body]).forEach(function(body, i) {
					var callback = (byId[body.id] && byId[body.id].callback) || (requests[i] && requests[i].callback) || _.noop; // WARNING with noop
					if (body.error) return callback(null, body.error);
					if (!body.result) return callback(body);
					callback(null, null, body.result);
				});
			});
		});

		if (options.timeout && req.setTimeout) req.setTimeout(options.timeout);
		req.on("error", callbackAll);
		req.on("timeout", function() { callbackAll(new Error("rpc request timed out")) });
		if (! isGet) req.write(body);
		req.end();
	};
	return client;
};

module.exports = rpcClient;
module.exports.genID = genID;
module.exports.receiveJSON = receiveJSON;
module.exports.http = http;
