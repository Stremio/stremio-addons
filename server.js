var jayson = require("jayson");
var jaysonUtils = require("jayson/lib/utils");
var _ = require("lodash");
var url = require("url");
var request = require("request");

var SESSION_LIVE = 2*60*60*1000; // 2 hrs

function Server(methods, options)
{	
	function meta(cb) {
		cb(null, {
			methods: Object.keys(methods)
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

			checkSession(auth, function(err, session) {
				if (err) return callback(err);
				methods[method](args, callback, session);
			});
		};
	} });
	var listener = jaysonUtils.getHttpListener({ }, server);

	this.middleware = function(req, res, next) {
		var parsed = url.parse(req.url);
		if (parsed.pathname != module.parent.STREMIO_PATH) return next();
		
		listener(req, res);
	};
};

module.exports = Server;