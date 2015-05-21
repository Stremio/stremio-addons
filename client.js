var _ = require("lodash");
var async = require("async");
var mpath = require("mpath");
var util = require("util");
var EventEmitter = require("events").EventEmitter;

function bindDefaults(call) {
	return {
		meta: {
			get: call.bind(null, "meta.get"),
			find: call.bind(null, "meta.find"),
			search: call.bind(null, "meta.search")
			// we also have meta.submit
		},
		index: { 
			get: call.bind(null, "index.get")
		},
		stream: {
			get: call.bind(null, "stream.get"),
			find: call.bind(null, "stream.find")
		},
		subtitles: {
			get: call.bind(null, "subtitles.get")
		}
	}
};

// Check arguments against the service's filter
// TODO: unit test this
function checkArgs(args, filter)
{
	if (_.isEmpty(filter)) return true;

	var args = (args.items && args.items[0]) || args; // if many requests are batched
	return _.some(filter, function(val, key) {
		var v = mpath.get(key, args);
		if (val.$exists) return (v !== undefined) == val.$exists;
		if (val.$in) return _.intersection(Array.isArray(v) ? v : [v], val.$in).length;
	});
};
// TODO: unit test this properly
/*
var f = { "query.id": { $exists: true }, "query.type": { $in: ["foo", "bar"] }, toplevel: { $exists: true } };
console.log(checkArgs({ toplevel: 5 }, f) === true);
console.log(checkArgs({ query: { id: 2 } }, f) === true);
console.log(checkArgs({ query: { type: "foo" } }, f) === true);
console.log(checkArgs({ query: { type: "bar" } }, f) === true);
console.log(checkArgs({ query: { type: ["bar"] } }, f) === true);
console.log(checkArgs({query: { type: "somethingelse" } }, f) === false);
console.log(checkArgs({ query: {} }, f) === false);
console.log(checkArgs({ query: { idx: 5 } } , f) === false);
*/

function Service(url, options, client, ready)
{
	var self = this;

	this.client = client(url+(module.parent ? module.parent.STREMIO_PATH : "/stremio/v1") );
	this.url = url;
	this.priority = options.priority || 0;
	this.initialized = false;
	this.manifest = { };
	this.methods = [];

	var q = async.queue(function(task, done) {
		if (self.initialized) return done();

		self.client.request("meta", [], function(err, error, res) {
			if (err) { console.error(err); return done(); }
			
			if (error) console.error(error);
			self.initialized = true;
			if (res && res.methods) self.methods = self.methods.concat(res.methods);
			if (res && res.manifest) self.manifest = res.manifest;
			// TODO: error handling, retry, auth, etc.
			if (ready) ready();
			done();
		});
	}, 1);

	q.push({ }, function() { }); // Start initialization now

	this.call = function(method, args, cb, noFilter)
	{
		if (cb) cb = _.once(cb);
		q.push({ }, function() {
			if (self.methods.indexOf(method) == -1) return cb(1);
			if (!noFilter && self.manifest.filter && !checkArgs(args[1], self.manifest.filter)) return cb(2);  		
			self.client.request(method, args, function(err, error, res) { cb(0, err, error, res) });
		});
	};
};

function Stremio(options)
{
	var self = this;
	
	Object.defineProperty(self, "supportedTypes", { enumerable: true, get: function() { 
		return getTypes(self.getServices("meta.find"));
	} });

	options = options || {};

	var auth;
	var services = {};

	// Set the authentication
	this.setAuth = function(url, token) {
		auth = [url, token];
	};
	this.getAuth = function() { return auth };

	// Adding services
	this.addService = function(url, opts) {
		if (services[url]) return;
		services[url] = new Service(url, opts || {}, options.client || require("jayson").client.http, function() { 
			// callback for ready service
		});
	};
	
	// Removing
	this.removeService = function(url) {
		delete services[url];	
	};
	this.removeAllServices = function() {
		services = { };
	};
	
	// Listing
	this.getServices = function(forMethod, all) {
		var res = _.values(services).sort(function(a,b) { return (b.initialized - a.initialized) || (a.priority - b.priority) });
		if (forMethod) res = res.filter(function(x){ return (x.methods || []).indexOf(forMethod) != -1 });
		if (forMethod) res = picker(res, forMethod); // apply the picker for a method
		return res;
	};

	// Bind methods
	function call(method, args, cb) {
		var s = self.getServices();
		s = picker(s, method);

		var tried = { }; // Services for which we won't use args filter because we're retrying them

		async.forever(function(next) {
			var service = s.shift();
			if (! service) return next(true); // end the loop

			service.call(method, [auth, args], function(skip, err, error, res) {
				// err, error are respectively HTTP error / Jayson error; we need to implement fallback based on that (do a skip)
				if (skip == 2) { tried[service.url] = true; s.push(service); } // re-try the service if skip===2 (skipped due to args filter)
				if (skip || err) return next(); // Go to the next service

				cb(error, res, service);
				next(1); // Stop
			}, tried[service.url]); // If we try it a second time, don't care about the args filter
		}, function(err) {
			if (err !== 1) cb(new Error(self.getServices(method).length ? "no service supports these arguments" : "no service supplies this method"));
		});
	};
	_.extend(this, bindDefaults(call))
	this.call = call;

	function picker(s,method) {
		var params = { services: s, method: method };
		if (options.picker) params.services = options.picker(params.services, params.method);
		self.emit("pick", params);
		return params.services;
	}
};
util.inherits(Stremio, EventEmitter);

// Utility to get supported types for this client
function getTypes(services) {
	var types = {};
	services
	.forEach(function(service) { 
		if (service.manifest.types) service.manifest.types.forEach(function(t) { types[t] = true });
	});
	
	return types;
};

module.exports = Stremio;
