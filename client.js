var _ = require("lodash");
var async = require("async");
var jayson = require("jayson");

function bindDefaults(call) {
	meta: {
		get: call.bind(null, "meta.get"),
		find: call.bind(null, "meta.find"),
		search: call.bind(null, "meta.search")
	},
	index: { 
		get: call.bind(null, "index.get")
	},
	stream: {
		get: call.bind(null, "stream.get")
	}
};


function Stremio(options)
{
	var services = {} ;

	// Adding services
	this.addService = function(url) {
		if (services[url]) return;
		services[url] = {
			client: (options.client || jayson.client.http)({ url: url+module.parent.STREMIO_PATH })
		};
	};

	// Bind methods
	function call(method, cb) { /*q.push({ method: method, cb: cb })*/ };
	_.extend(this, bindDefaults(call))
	this.call = call;
};

module.exports = Stremio;
