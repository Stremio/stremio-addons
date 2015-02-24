var _ = require("lodash");
var async = require("async");
var jayson = require("jayson");

function bindDefaults(call) {
	return {
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
	}
};

function Service(url, options, client)
{
	this.client = client({ url: url });
	this.url = url;
	this.priority = options.priority || 0;

	this.call = function(method, cb)
	{

	};
};

function Stremio(options)
{
	var services = {} ;

	// Adding services
	this.addService = function(url, opts) {
		if (services[url]) return;
		services[url] = new Service(url, opts, options.client || jayson.client.http);
	};

	// Bind methods
	function call(method, cb) {
		var keys = Object.keys(services).sort(function(a,b) { return services[b].priority - services[a].priority });
		async.each(keys, function(key, next) {
			var service = services[key];
			service.call(method, function(skip, err, res) {
				if (skip) return next(); // Go to the next service

				cb(err, res);
				next(1); // Stop
			});
		});
	};
	_.extend(this, bindDefaults(call))
	this.call = call;
};

module.exports = Stremio;
