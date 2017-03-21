require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"events":2,"extend":3}],2:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],3:[function(require,module,exports){
'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
var toStr = Object.prototype.toString;

var isArray = function isArray(arr) {
	if (typeof Array.isArray === 'function') {
		return Array.isArray(arr);
	}

	return toStr.call(arr) === '[object Array]';
};

var isPlainObject = function isPlainObject(obj) {
	if (!obj || toStr.call(obj) !== '[object Object]') {
		return false;
	}

	var hasOwnConstructor = hasOwn.call(obj, 'constructor');
	var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
	// Not own constructor property must be Object
	if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
		return false;
	}

	// Own properties are enumerated firstly, so to speed up,
	// if last one is own, then all properties are own.
	var key;
	for (key in obj) {/**/}

	return typeof key === 'undefined' || hasOwn.call(obj, key);
};

module.exports = function extend() {
	var options, name, src, copy, copyIsArray, clone,
		target = arguments[0],
		i = 1,
		length = arguments.length,
		deep = false;

	// Handle a deep copy situation
	if (typeof target === 'boolean') {
		deep = target;
		target = arguments[1] || {};
		// skip the boolean and the target
		i = 2;
	} else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
		target = {};
	}

	for (; i < length; ++i) {
		options = arguments[i];
		// Only deal with non-null/undefined values
		if (options != null) {
			// Extend the base object
			for (name in options) {
				src = target[name];
				copy = options[name];

				// Prevent never-ending loop
				if (target !== copy) {
					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && isArray(src) ? src : [];
						} else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[name] = extend(deep, clone, copy);

					// Don't bring in undefined values
					} else if (typeof copy !== 'undefined') {
						target[name] = copy;
					}
				}
			}
		}
	}

	// Return the modified object
	return target;
};


},{}],"stremio-addons":[function(require,module,exports){
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

},{"./client":1}]},{},[]);
