module.exports = {
	"stream_args": function(args) {
	    if (! ( (args.query && typeof(args.query)=="object") || args.infoHash)) return { code: 0, message: "query/infoHash requried" };
	    return false;
	},
	"stream": function(stream) {
		if (isNaN(stream.availability)) 
			return { code: 3, message: "availability required in result of stream.*" };
		if (! ( (stream.infoHash && stream.infoHash.length == 40) || stream.url) ) 
			return { code: 4, message: "a stream descriptor required in result of stream.*" };

		if (stream.infoHash && isNaN(stream.mapIdx) )
			return { code: 5, message: "mapIdx (file id) required with infoHash in result of stream.*" };

		return false;
	},

	"meta_args": function(args) {

	},
	"meta": function(meta) {

	}
};