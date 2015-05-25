var _ = require("lodash");
var url = require("url");
var request = require("request");

var SESSION_LIVE = 2*60*60*1000; // 2 hrs

function Server(methods, options, manifest)
{	
	var jayson = require("jayson");
	var jaysonUtils = require("jayson/lib/utils");
	
	Object.keys(methods).forEach(function(key) {
		if (typeof(methods[key]) != "function") throw Error(key+" should be a function");
	});

	function meta(cb) {
		cb(null, {
			methods: Object.keys(methods),
			manifest: _.extend({ methods: Object.keys(methods) }, manifest || {})
		});
	};

	var sessions = { };
	function checkSession(auth, cb) {
		var id = auth[1];
		if (options.allow && options.allow.indexOf(auth[0])==-1) return cb({ message: "not allowed to auth via that server", code: 2 });

		if (sessions[auth[1]]) return cb(null, sessions[auth[1]]);

		request({ json: true, url: auth[0]+"/stremio/service/"+options.secret+"/"+encodeURIComponent(auth[1]) }, function(err, resp, body) {
			if (err) return cb({ message: "failed to connect to center", code: 5 });
			if (resp.statusCode==200) {
				sessions[auth[1]] = body;
				setTimeout(function() { delete sessions[auth[1]] }, SESSION_LIVE);
				return cb(null, body);
			};

			if (!body.message) console.error("auth server returned",body);
			return cb(body.message ? body : { message: "unknown error reaching auth server", code: 8 }); // error
		})
	};


	var server = jayson.server({ }, { router: function(method) {
		if (method == "meta") return meta;
		if (! methods[method]) return null;
		
		return function(auth, args, callback) {
			if (! auth) return callback({ message: "auth not specified", code: 1 });
			if (!auth[1] && methods[method].noauth) return methods[method](args,callback,{ noauth: true }); // the function is allowed without auth

			checkSession(auth, function(err, session) {
				if (err && methods[method].noauth) return methods[method](args,callback,{ noauth: true }); // the function is allowed without auth
				if (err) return callback(err);
				methods[method](args, callback, session);
			});
		};
	} });
	var listener = jaysonUtils.getHttpListener({ }, server);

	this.middleware = function(req, res, next) {
		var parsed = url.parse(req.url);
		if (parsed.pathname != module.parent.STREMIO_PATH) return next();
		
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
		res.setHeader("Access-Control-Allow-Origin", "*");
		listener(req, res);
	};
};

module.exports = Server;
