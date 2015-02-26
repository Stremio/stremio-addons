var jayson = require("jayson");
var jaysonUtils = require("jayson/lib/utils");
var _ = require("lodash");
var url = require("url");
var request = require("request");

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
		return cb(null, 1);
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