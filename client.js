var _ = require("lodash");
var async = require("async");

function bindDefaults(call) {
	meta: {
		get: call.bind(null, "meta.get"),
		find: call.bind(null, "meta.find"),
		search: call.bind(null, "meta.search")
	},
	index: { 
		get: call.bind(null, "index.get")
	},
	stream: {
		get: call.bind(null, "stream.get")
	}
};


function Stremio()
{
	function call(method, cb) {

	};

	// Bind methods
	_.extend(this, bindDefaults(call))
	this.call = call;
};