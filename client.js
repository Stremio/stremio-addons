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
	var self = this;

	this.client = client({ url: url });
	this.url = url;
	this.priority = options.priority || 0;

	var methods = [], initialized = false;
	var q = async.queue(function(task, done) {
		if (initialized) return done();
		self.client.request("handshake", { }, function(err, res) {
			initialized = true;
			if (res.methods) methods = methods.concat(res.methods);
			// TODO: error handling, retry, auth, etc.
		});
	}, 1);

	this.call = function(method, args, cb)
	{
		q.push({ }, function() {
			if (methods.indexOf(method) == -1) cb(true);
			self.client.request(method, args, function(err, res) { cb(false, err, res) });
		});
	};
};

function Stremio(options)
{
	options = options || {};

	var services = {};

	// Adding services
	this.addService = function(url, opts) {
		if (services[url]) return;
		services[url] = new Service(url, opts, options.client || jayson.client.http);
	};

	// Bind methods
	function call(method, args, cb) {
		var keys = Object.keys(services).sort(function(a,b) { return services[a].priority - services[b].priority });
		async.each(keys, function(key, next) {
			var service = services[key];
			service.call(method, args, function(skip, err, res) {
				if (skip) return next(); // Go to the next service

				cb(err, res);
				next(1); // Stop
			});
		});
	};
	_.extfend(this, bindDefaults(call))
	this.call = call;
};

module.exports = Stremio;