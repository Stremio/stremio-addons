var jayson = require("jayson");
var jaysonUtils = require("jayson/lib/utils");
var _ = require("lodash");
var url = require("url");

function Server(methods)
{	
	function handshake(args, cb) {
		cb(null, {
			methods: Object.keys(methods)
		});
	};

	this.middleware = function(req, res, next) {
		var parsed = url.parse(req.url);
		if (parsed.pathname != module.parent.STREMIO_PATH) return next();
		
		var server = jayson.server(_.extend({ }, methods, { handshake: handshake }));
		jaysonUtils.getHttpListener({ }, server)(req, res);
		//jayson.server(_.extend({ }, methods, { handshake: handshake })).middleware()(req, res, next);
	};
};

module.exports = Server;