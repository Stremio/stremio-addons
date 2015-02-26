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

	this.client = client(url+module.parent.STREMIO_PATH);
	this.url = url;
	this.priority = options.priority || 0;

	var methods = [], initialized = false;
	var q = async.queue(function(task, done) {
		if (initialized) return done();

		self.client.request("handshake", [{ user: null }], function(err, error, res) {
			if (err || error) console.error(err, error);
			initialized = true;
			if (res && res.methods) methods = methods.concat(res.methods);
			// TODO: error handling, retry, auth, etc.
			done();
		});
	}, 1);

	this.call = function(method, args, cb)
	{
		q.push({ }, function() {
			if (methods.indexOf(method) == -1) return cb(true);
			self.client.request(method, args, function(err, error, res) { cb(false, err, error, res) });
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
		services[url] = new Service(url, opts || {}, options.client || jayson.client.http);
	};

	// Bind methods
	function call(method, args, cb) {
		var s = _.values(services).sort(function(a,b) { return a.priority - b.priority });
		if (options.picker) s = options.picker(s);
		async.each(s, function(service, next) {
			service.call(method, [args], function(skip, err, error, res) {
				// err, error are respectively HTTP error / Jayson error; we need to implement fallback based on that (do a skip)
				if (skip || err) return next(); // Go to the next service

				cb(error, res);
				next(1); // Stop
			});
		}, function(err) {
			if (err !== 1) cb(new Error("no service that supplies this method"));
		});
	};
	_.extend(this, bindDefaults(call))
	this.call = call;
};

module.exports = Stremio;