module.CENTRAL = "http://api9.strem.io";
module.exports.Client = require("./client");
module.exports.Client.RPC = function(endpoint) {
	var self = { };
	self.request = function(method, params, callback) {
		var body = JSON.stringify({ params: params, method: method, id: 1, jsonrpc: "2.0" });
		var buf = new buffer.Buffer(body);

		if (stremio.options.disableHttps) endpoint = endpoint.replace("^https", "http");

		var request = ((body.length < 8192) && endpoint.match("/stremioget")) ?
			fetch(endpoint+"/q.json?b="+buf.toString("base64")) // GET
			: fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": buf.length }, body: body }); // POST

		request.then(function(resp) {
			if (resp.status !== 200) return callback(new Error("response code "+resp.status));
			if (resp.headers.get("content-type").indexOf("application/json") === -1) return callback(new Error("no application/json response"));

			resp.json().then(function(body) {
				setTimeout(function() {
					if (!body || body.error) return callback(null, (body && body.error) || new Error("empty body"));
					callback(null, null, body.result);
				});
			}, callback).catch(callback);
		}).catch(callback);
	};
	return self;
};
