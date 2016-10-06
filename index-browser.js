module.CENTRAL = "http://api9.strem.io";
module.exports.Client = require("./client");
/*
// Fetch-based client
module.exports.Client.RPC = function(endpoint) {
	var self = { };
	self.request = function(method, params, callback) {
		var body = JSON.stringify({ params: params, method: method, id: 1, jsonrpc: "2.0" });

		var request = ((body.length < 8192) && endpoint.match("/stremioget")) ?
			window.fetch(endpoint+"/q.json?b="+btoa(body)) // GET
			: window.fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: body }); // POST

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
*/

// XMLHttpRequest-based client
module.exports.Client.RPC = function (endpoint) {
	var self = { };

	self.request = function(method, params, callback) {
		var body = JSON.stringify({ params: params, method: method, id: 1, jsonrpc: "2.0" });

		var request = new XMLHttpRequest();

		request.onreadystatechange = function() {
			if (request.readyState == XMLHttpRequest.DONE) {
				if (request.status == 200) {
					var res;
					try {
						res = JSON.parse(request.responseText);
					} catch(e) { callback(e) }

					callback(null, res.error, res.result);
				} else callback("network err "+request.status);
			}
		}

		request.open("GET", endpoint+"/q.json?b="+btoa(body), true);
		request.send();
	};
	return self;
}
