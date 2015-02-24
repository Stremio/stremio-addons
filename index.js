
function bindMethods(call) {
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

};