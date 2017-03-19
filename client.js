var emitter = require("events").EventEmitter;
var extend = require("extend");

var MAX_RETRIES = 4;
var SERVICE_RETRY_TIMEOUT = 30*1000;

var LENGTH_TO_FORCE_POST=8192;

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
			find: call.bind(null, "stream.find")
		},
		subtitles: {
			get: call.bind(null, "subtitles.get"),
			find: call.bind(null, "subtitles.find")
		}
	}
};

// Check priority based on arguments - e.g. on type and idProperty
function checkArgs(args, manifest)
{
	var score = 0;
	if (! args.query) return score;
	if ((manifest.types || []).indexOf(args.query.type)!=-1) score++;
        if (!manifest.idProperty && manifest.filter) Object.keys(manifest.filter).some(function(k) {
                if (k.match("_id$")) return manifest.idProperty = k.split(".").pop() 
        });
	(Array.isArray(manifest.idProperty) ? manifest.idProperty : [manifest.idProperty]).forEach(function(prop) { if (args.query.hasOwnProperty(prop)) score++ });
	if (args.query.id && args.query.id.toString().indexOf(manifest.idProperty) === 0) score++;
	return score;
};


function Addon(url, options, stremio, ready)
{
	var self = this;

	var client = options.client || Stremio.RPC;

	if (typeof(url) == "string") {
		this.client = client(url, { 
			timeout: options.timeout || stremio.options.timeout || 10000,
			respTimeout: options.respTimeout || stremio.options.respTimeout //|| 10000,
		}, stremio.options);
		this.url = url;
	} else {
		// Locally required add-on, emulate .client
		this.client = { request: function(method, args, cb) { 
			url.request(method, args, function(err, res) { cb(null, err, res) }) 
		} };
		this.url = url.toString();
	}

	if (ready) stremio.once("addon-meta:"+self.url, function() { ready(null, self) });

	this.priority = options.priority || 0;
	this.initialized = false;
	this.initializing = false;
	this.manifest = { };
	this.methods = [];
	this.retries = 0;
	this.idx = stremio.count++;

	initialize();

	function initialize() {
		self.initializing = true;
		self.client.request("meta", [], function(err, error, res) {
			self.initializing = false;
			self.networkErr = err;
			if (err) { stremio.emit("network-error", err, self, self.url) } // network error. just ignore
			
			// Re-try if the add-on responds with error on meta; this is usually due to a temporarily failing add-on
			if (error) { 
				console.error(error); 
				if (self.retries++ < MAX_RETRIES) setTimeout(function() { self.initialized = false }, SERVICE_RETRY_TIMEOUT); 
			} // service error. mark initialized, can re-try after 30 sec
			self.initialized = true;
			self.retries = 0; // return retries back to 0
			if (res && res.methods) self.methods = [].concat(res.methods);
			if (res && res.manifest) self.manifest = res.manifest;
			if (res) stremio.emit("addon-ready", self, self.url);
			stremio.emit("addon-meta:"+self.url, self, err, res);
		});
	}

	this.call = function(method, args, cb)
	{
		// wait for initialization
		if (! self.initialized) {
			if (! self.initializing) initialize();
			stremio.once("addon-meta:"+self.url, function() { self.call(method, args, cb) });
			return;
		}

		// Validate arguments - we should do this via some sort of model system
		if (self.methods.indexOf(method) == -1) return cb(1);
		self.client.request(method, args, function(err, error, res) { cb(0, err, error, res) });
	};

	this.identifier = function() {
		return (self.manifest && self.manifest.id) || self.url
	};

	this.isInitializing = function() {
		return !this.initialized && !q.idle();
	};

	this.reinitialize = function() {
		//this.initialized = false;
		this.retries = 0;
		initialize();
	};
};

function Stremio(options)
{
	var self = this;
	emitter.call(this);
	
	//self.setMaxListeners(200); // something reasonable

	Object.defineProperty(self, "supportedTypes", { enumerable: true, get: function() {
		var types = {};
		self.get("meta.find").forEach(function(service) { 
			if (service.manifest.types) service.manifest.types.forEach(function(t) { types[t] = true });
		});
		return types;
	} });

	options = self.options = options || {};

	var services = { };

	// counter
	this.count = 0;

	// Adding services
	// add(string url, object opts, function)
	// add(string url, function callback)
	this.add = function(url, opts, cb) {
		if (typeof(opts) === "function") { cb = opts; opts = { } };
		cb = (typeof(cb) === "function") ? cb : function() { };
		if (services[url]) {
			cb(null, services[url]);
			return services[url];
		}
		services[url] = new Addon(url, extend({}, options, opts || {}), self, cb);
		return services[url];
	};
	
	// Removing
	this.remove = function(url) {
		delete services[url];	
	};
	this.removeAll = function() {
		services = { };
	};
	
	// Listing
	this.get = function(forMethod, forArgs, noPicker) {
		var res = Object.keys(services).map(function(k) { return services[k] });
		if (forMethod) res = res.filter(function(x) { return x.initialized ? x.methods.indexOf(forMethod) != -1 : true }); // if it's not initialized, assume it supports the method
		if (forMethod && !noPicker) res = picker(res, forMethod); // apply the picker for a method

		var cmp = function(a, b, fn) { return fn(a) - fn(b) };
		return res.sort(function(a, b) {
			return cmp(b, a, function(x) { return x.initialized && !x.networkErr }) // sort by whether it's usable
				|| cmp(b, a, function(x) { return forArgs ? checkArgs(forArgs, x.manifest) : 0 }) // sort by relevance to arguments
				|| cmp(b, a, function(x) { return x.priority }) // compare prio // sort by priority
				|| a.idx - b.idx // index in the entire array
		});
	};

	function fallthrough(s, method, args, cb) {
		var networkErr; // save last network error to return it potentially
		
		function next() {
			var service = s.shift();
			if (! service) return cb(networkErr || new Error("no addon supplies this method / arguments")); 

			service.call(method, [null, args], function(skip, err, error, res) {				
				networkErr = err;
				// err, error are respectively HTTP error / JSON-RPC error; we need to implement fallback based on that (do a skip)
				if (skip || err) return next(); // Go to the next service

				cb(error, res, service);
			});
		};
		next();
	};

	function call(method, args, cb) {
		return fallthrough(self.get(method, args), method, args, cb);
	};

	function picker(s, method) {
		var params = { addons: s, method: method };
		if (options.picker) params.addons = options.picker(params.addons, params.method);
		self.emit("pick", params);
		return [].concat(params.addons);
	}


	this.fallthrough = fallthrough;
	this.call = call;
	this.checkArgs = checkArgs;
	extend(this, bindDefaults(call));

};

// Inherit the emitter
Stremio.super_ = emitter;
Stremio.prototype = new emitter();
Stremio.prototype.constructor = Stremio;

module.exports = Stremio;
