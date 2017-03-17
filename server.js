var url = require("url");
var rpc = require("./rpc");
var extend = require("extend");
var async = require("async");

var template;

var SESSION_LIVE = 10*60*60*1000; // 10 hrs
var CACHE_TTL = 2.5 * 60 * 60; // seconds to live for the cache

var CENTRAL = "https://api9.strem.io";

function Server(methods, options, manifest)
{
	var self = this;

	if (options && typeof(manifest) === "undefined") {
		manifest = options;
		options = null;
	}

	options = extend({ 
		allow: [ CENTRAL ], // default stremio central
		secret: "8417fe936f0374fbd16a699668e8f3c4aa405d9f" // default secret for testing add-ons
	}, options || { });

	this.methods = methods;
	this.manifest = manifest;
	this.options = options;

	Object.keys(methods).forEach(function(key) {
		if (typeof(methods[key]) != "function") throw Error(key+" should be a function");
	});

	// Announce to central
	self.announced = false;
	function announce() {
		self.announced = true;
		var body = JSON.stringify({ id: manifest.id, manifest: manifest });
		var parsed = url.parse(CENTRAL+"/stremio/announce/"+options.secret);
		var req = (parsed.protocol.match("https") ? require("https") : require("http")).request(extend(parsed, { 
			method: "POST", headers: { "Content-Type": "application/json", "Content-Length": body.length } 
		}), function(res) { if (res.statusCode !== 200) console.error("Announce error for "+manifest.id+", statusCode: "+res.statusCode); });
		req.on("error", function(err) { console.error("Announce error for "+manifest.id, err) });
		req.end(body);
	}

	// Introspect the addon
	function meta(cb) {
		cb(null, {
			methods: Object.keys(methods),
			manifest: extend({ methods: Object.keys(methods) }, manifest || {})
		});
	};

	// In case we use this in place of endpoint URL
	this.toString = function() {
		return self.manifest.id;
	};

	// Direct interface
	this.request = function(method, params, cb) {
		if (method == "meta") return meta(cb);
		if (! methods[method]) return cb({ message: "method not supported", code: -32601 }, null);

		var auth = params[0], // AUTH is obsolete
			args = params[1] || { };

		return methods[method](args, cb, { stremioget: true }); // everything is allowed without auth in stremioget mode
	};

	// HTTP middleware
	this.middleware = function(req, res, next) {
		if (!self.announced && !manifest.dontAnnounce) announce();

		var start = Date.now(), finished = false;
		req._statsNotes = [];
		var getInfo = function() { return [req.url].concat(req._statsNotes).filter(function(x) { return x }) };
		if (process.env.STREMIO_LOGGING) {
			res.on("finish", function() {
				finished = true;
				console.log("\x1b[34m["+(new Date()).toISOString()+"]\x1b[0m -> \x1b[32m["+(Date.now()-start)+"ms]\x1b[0m "+getInfo().join(", ")+" / "+res.statusCode)
			});
			setTimeout(function() { if (!finished) console.log("-> \x1b[31m[WARNING]\x1b[0m "+getInfo().join(", ")+" taking more than 3000ms to run") }, 3000);
		}

		var parsed = url.parse(req.url);
		
		req._statsNotes.push(req.method); // HTTP method

		if (req.method === "OPTIONS") {
			var headers = {};
			headers["Access-Control-Allow-Origin"] = "*";
			headers["Access-Control-Allow-Methods"] = "POST, GET, PUT, DELETE, OPTIONS";
			headers["Access-Control-Allow-Credentials"] = false;
			headers["Access-Control-Max-Age"] = "86400"; // 24 hours
			headers["Access-Control-Allow-Headers"] = "X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept";
			res.writeHead(200, headers);
			res.end();
			return;
		};
		
		if (req.method == "POST" || ( req.method == "GET" && parsed.pathname.match("q.json$") ) ) return serveRPC(req, res, function(method, params, cb) {
			req._statsNotes.push(method); // stremio method
			self.request(method, params, cb);
		}); else if (req.method == "GET") { // unsupported by JSON-RPC, it uses post
			return landingPage(req, res);
		}

		res.writeHead(405); // method not allowed
		res.end();
	};

	function serveRPC(req, res, handle) {
		var isGet = req.url.match("q.json");
		var isJson = req.headers["content-type"] && req.headers["content-type"].match("^application/json");
		if (!(isGet || isJson)) return res.writeHead(415); // unsupported media type
		res.setHeader("Access-Control-Allow-Origin", "*");
		
		function formatResp(id, err, body) {
			var respBody = { jsonrpc: "2.0", id: id };
			if (err) respBody.error = { message: err.message, code: err.code || -32603 };
			else respBody.result = body;
			return respBody;
		};
		function send(respBody, ttl) {
			respBody = JSON.stringify(respBody);
			res.setHeader("Content-Type", "application/json");
			res.setHeader("Content-Length", Buffer.byteLength(respBody, "utf8"));
			if (! (req.headers.host && req.headers.host.match(/localhost|127.0.0.1/))) {
				res.setHeader("Cache-Control", "public, max-age="+(ttl || CACHE_TTL) ); // around 2 hours default
			}
			res.end(respBody);
		};

		rpc.receiveJSON(req, function(err, body) {
			if (err) return send({ code: -32700, message: "parse error" }); // TODO: jsonrpc, id prop

			var ttl = CACHE_TTL;
			if (!isNaN(options.cacheTTL)) ttl = options.cacheTTL;
			if (options.cacheTTL && options.cacheTTL[body.method]) ttl = options.cacheTTL[body.method];
				
			if (Array.isArray(body)) {
				async.map(body, function(b, cb) { 
					// WARNING: same logic as -->
					if (!b || !b.id || !b.method) return cb(null, formatResp(null, { code: -32700, message: "parse error" })); 
					handle(b.method, b.params, function(err, bb) { cb(null, formatResp(b.id, err, bb)) });
				}, function(err, bodies) { send(bodies, ttl) });
			} else { 
				// --> THIS
				if (!body || !body.id || !body.method) return send(formatResp(null, { code: -32700, message: "parse error" }));
				handle(body.method, body.params, function(err, b) { send(formatResp(body.id, err, b), ttl) });
			}
		});
	};

	function landingPage(req, res) {
		var endpoint = manifest.endpoint || "http://"+req.headers.host+req.url;
		var stats = { }, top = [];

		// TODO: cache at least stats.get for some time
		if (! self.methods['stats.get']) return respond();
		
		self.request("stats.get", [{ stremioget: true }], function(err, s) {
 			if (err) console.log(err);
			if (s) stats = s;
			if (! self.methods['meta.find']) return respond();
			self.request("meta.find", [{stremioget: true}, { query: {}, limit: 10 }], function(err, t) {
				if (err) return error(err);
				if (t) top = t;
				respond();
			});
		});

		function error(e) {
			console.error("LANDING PAGE ERROR",e);
			res.writeHead(500); res.end();
		}

		function respond() {
			try { 
				if (! template) template = require("ejs").compile(require("fs").readFileSync(__dirname+"/addon-template.ejs").toString(), { });
				var body = template({ 
					addon: { manifest: manifest, methods: methods }, 
					endpoint: endpoint, 
					stats: stats, top: top 
				});
				res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
				res.end(body);
			} catch(e) { error(e) }
		}
	}
};

module.exports = Server;
