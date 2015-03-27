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
			get: call.bind(null, "stream.get"),
			find: call.bind(null, "stream.find")
		}		
	}
};

// Check arguments against the service's filter
// TODO: unit test this
function checkArgs(args, filter)
{
	if (_.isEmpty(filter)) return true;

	return _.some(filter, function(val, key) {
		if (val.$exists) return args.hasOwnProperty(key) == val.$exists;
		if (val.$in) return _.intersection(Array.isArray(args[key]) ? args[key] : [args[key]], val.$in).length;
	});
};
// TODO: unit test this properly
/*
var f = { id: { $exists: true }, type: { $in: ["foo", "bar"] } };
console.log(checkArgs({ id: 2 }, f) === true);
console.log(checkArgs({ type: "foo" }, f) === true);
console.log(checkArgs({ type: "bar" }, f) === true);
console.log(checkArgs({ type: ["bar"] }, f) === true);
console.log(checkArgs({ type: "somethingelse" }, f) === false);
console.log(checkArgs({ }, f) === false);
console.log(checkArgs({ idx: 5 }, f) === false);
*/

function Service(url, options, client, ready)
{
	var self = this;

	this.client = client(url+module.parent.STREMIO_PATH);
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

	this.call = function(method, args, cb)
	{
		if (cb) cb = _.once(cb);
		q.push({ }, function() {
			if (self.methods.indexOf(method) == -1) return cb(true);
			if (self.manifest.filter && !checkArgs(args[1], self.manifest.filter)) return cb(true);  		
			self.client.request(method, args, function(err, error, res) { cb(false, err, error, res) });
		});
	};
};

function Stremio(options)
{
	var self = this;
	this.supportedTypes = {};
	
	options = options || {};

	var auth;
	var services = {};

	// Set the authentication
	this.setAuth = function(url, token) {
		auth = [url, token];
	};

	// Adding services
	this.addService = function(url, opts) {
		if (services[url]) return;
		services[url] = new Service(url, opts || {}, options.client || jayson.client.http, function() { 
			self.supportedTypes = getTypes(self.getServices("meta.find"));
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
	this.getServices = function(forMethod) {
		var res = _.values(services).sort(function(a,b) { return (b.initialized - a.initialized) || (a.priority - b.priority) });
		if (forMethod) res = res.filter(function(x){ return (x.methods || []).indexOf(forMethod) != -1 });
		return res;
	};

	// Bind methods
	function call(method, args, cb) {
		var s = self.getServices();
		if (options.picker) s = options.picker(s);
		async.eachSeries(s, function(service, next) {
			service.call(method, [auth, args], function(skip, err, error, res) {
				// err, error are respectively HTTP error / Jayson error; we need to implement fallback based on that (do a skip)
				if (skip || err) return next(); // Go to the next service

				cb(error, res, service);
				next(1); // Stop
			});
		}, function(err) {
			if (err !== 1) cb(new Error(self.getServices(method).length ? "no service supports these arguments" : "no service supplies this method"));
		});
	};
	_.extend(this, bindDefaults(call))
	this.call = call;
};

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
