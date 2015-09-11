var _ = require("lodash");
var async = require("async");
var mpath = require("mpath");
var util = require("util");
var utils = require("./utils");

var validation = require("./validation");

var MAX_RETRIES = 3;
var SERVICE_RETRY_TIMEOUT = 30*1000;

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
	if (!filter || _.isEmpty(filter)) return true;

	return _.some(filter, function(val, key) {
		var v = mpath.get(key, args);
		if (val.$exists) return (v !== undefined) == val.$exists;
		if (val.$in) return _.intersection(Array.isArray(v) ? v : [v], val.$in).length;
	});
};


function Addon(url, options, stremio, ready)
{
	var self = this;

	var client = options.client || rpcClient;
	this.client = client(url+(module.parent ? module.parent.STREMIO_PATH : "/stremio/v1") );
	this.url = url;
	this.priority = options.priority || 0;
	this.initialized = false;
	this.manifest = { };
	this.methods = [];
	this.retries = 0;

	var debounced = { }; // fill from stremio.debounced, but addon specific

	var q = async.queue(function(task, done) {
		if (self.initialized) return done();

		self.client.request("meta", [], function(err, error, res) {
			if (err) { stremio.emit("network-error", err, self, self.url); return done(); } // network error. just ignore
			
			if (error) { 
				console.error(error); 
				if (self.retries++ < MAX_RETRIES) setTimeout(function() { self.initialized = false; self.lastError = error; }, SERVICE_RETRY_TIMEOUT); 
			} // service error. mark initialized, can re-try after 30 sec
			self.initialized = true;
			self.lastError = null;
			if (res && res.methods) self.methods = self.methods.concat(res.methods);
			if (res && res.manifest) self.manifest = res.manifest;
			if (ready) ready();
			done();
		});
	}, 1);

	q.push({ }, function() { }); // Start initialization now

	this.call = function(method, args, cb)
	{
		// Validate arguments - we should do this via some sort of model system
		var err;
		if (method.match("^stream")) [args[1]].forEach(function(args) { err =  err || validation.stream_args(args) });
		if (err) return cb(0, null, err);

		if (stremio.debounced[method]) _.extend(debounced[method] = debounced[method] || { queue: [] }, { time: stremio.debounced[method] });

		if (cb) cb = _.once(cb);
		q.push({ }, function() {
			if (self.methods.indexOf(method) == -1) return cb(1);
			var m = (debounced[method] && self.client.enqueue) ? self.client.enqueue.bind(null, debounced[method]) : self.client.request;
			m(method, args, function(err, error, res) { cb(0, err, error, res) });
		});
	};

	this.identifier = function() {
		return (self.manifest && self.manifest.id) || self.url
	};

	this.isInitializing = function() {
		return !this.initialized && q.length();
	};
};

function Stremio(options)
{
	var self = this;
	require("events").EventEmitter.call(this);
	
	Object.defineProperty(self, "supportedTypes", { enumerable: true, get: function() { 
		return getTypes(self.get("meta.find"));
	} });

	options = options || {};

	var auth;
	var services = {};
	self.debounced = { };

	// Set the authentication
	this.setAuth = function(url, token) {
		auth = [url || module.parent.CENTRAL, token];
	};
	this.getAuth = function() { return auth };

	// Adding services
	this.add = function(url, opts) {
		if (services[url]) return;
		services[url] = new Addon(url, opts || {}, self, function() { 
			// callback for ready service
			self.emit("addon-ready", services[url], url);
		});
	};
	
	// Removing
	this.remove = function(url) {
		delete services[url];	
	};
	this.removeAll = function() {
		services = { };
	};
	
	// Listing
	this.get = function(forMethod, all) {
		var res = _.chain(services).values().sortBy(function(x){ return x.priority }).sortBy(function(x) { return -x.initialized }).value();
		if (forMethod) res = res.filter(function(x) { return x.initialized ? x.methods.indexOf(forMethod) != -1 : true }); // if it's not initialized, assume it supports the method
		if (forMethod) res = picker(res, forMethod); // apply the picker for a method
		return res;
	};

	// Set de-bounced batching
	this.setBatchingDebounce = function(method, ms) {
		if (self.manifest && self.methods.indexOf(method) == -1) return;
		self.debounced[method] = ms;
	};

	// Bind methods
	function call(method, args, cb) {
		var s = _.sortBy(self.get(method), function(x) { return -checkArgs(args, x.manifest.filter) });
		s = picker(s, method);

		async.forever(function(next) {
			var service = s.shift();
			if (! service) return next(true); // end the loop

			service.call(method, [auth, args], function(skip, err, error, res) {
				// err, error are respectively HTTP error / JSON-RPC error; we need to implement fallback based on that (do a skip)
				if (skip || err || (method.match("get$") && res === null) ) return next(); // Go to the next service

				cb(error, res, service);
				next(1); // Stop
			});
		}, function(err) {
			if (err !== 1) cb(new Error(self.get(method).length ? "no addon supports these arguments" : "no addon supplies this method"));
		});
	};
	_.extend(this, bindDefaults(call));
	this.call = call;

	function callEvery(method, args, cb) {
		var results = [], err;
		async.each(self.get(method).filter(function(x) { return x.initialized || !x.lastError }), function(service, callback) {
			service.call(method, [self.getAuth(), args], function(skip, err, error, result) {
				if (error) return callback(error);
				if (!skip && !err && !error) results.push(result);
				callback();
			});
		}, function(err) {
			cb(err, results);
		});
	};
	this.callEvery = callEvery;
        
        this.checkArgs = checkArgs;

	function picker(s, method) {
		var params = { addons: s, method: method };
		if (options.picker) params.addons = options.picker(params.addons, params.method);
		self.emit("pick", params);
		return [].concat(params.addons);
	}
};
util.inherits(Stremio, require("events").EventEmitter);

// Utility to get supported types for this client
function getTypes(services) {
	var types = {};
	services
	.forEach(function(service) { 
		if (service.manifest.types) service.manifest.types.forEach(function(t) { types[t] = true });
	});
	
	return types;
};

// Utility for JSON-RPC
// Rationales in our own client
// 1) have more control over the process, be able to implement debounced batching
// 2) reduce number of dependencies
function rpcClient(endpoint)
{
	var client = { };
	client.request = function(method, params, callback) {
		rpcRequest([{ callback: callback, params: params, method: method, id: utils.genID(), jsonrpc: "2.0" }]);
	};
	client.enqueue = function(handle, method, params, callback) {
		if (! handle.flush) handle.flush = _.debounce(function() {
			rpcRequest(handle.queue); handle.queue = [];
		}, handle.time);
		handle.queue.push({ callback: callback, params: params, method: method, id: utils.genID(), jsonrpc: "2.0" });
		handle.flush();
	};
	function rpcRequest(requests) { // supports batching
		requests.forEach(function(x) { x.callback = _.once(x.callback )});
		var body = JSON.stringify(requests.length == 1 ? requests[0] : requests);
		var byId = _.indexBy(requests, "id");
		var callbackAll = function() { requests.forEach(function(x) { x.callback && x.callback.apply(null, arguments) }) };
		var req = utils.http.request(_.extend(require("url").parse(endpoint), { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": body.length } }), function(res) {
			utils.receiveJSON(res, function(err, body) {
				if (err) return callbackAll(err);
				(Array.isArray(body) ? body : [body]).forEach(function(body) {
					var callback = (byId[body.id] && byId[body.id].callback) || _.noop;
					if (body.error) return callback(null, body.error);
					callback(null, null, body.result);
				});
			});
		});
		req.on("error", callbackAll);
		req.write(body);
		req.end();
	};
	return client;
};

module.exports = Stremio;
