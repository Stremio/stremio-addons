module.exports = {
	"stream.args": function(args) {
	    if (! (args.query || args.infoHash)) return { code: 0, message: "query/infoHash requried" };
	    if (args.query && !args.query.imdb_id) return { code: 1, message: "imdb_id required for query" };
	    if (args.query && (args.query.type == "series" && !(args.query.hasOwnProperty("episode") && args.query.hasOwnProperty("season"))))
	        return { code: 2, message: "season and episode required for series type" };
	    return false;
	},
	"stream": function(stream) {
		if (isNaN(stream.availability)) 
			return { code: 3, message: "availability required in result of stream.*" };
		if (! ( (stream.infoHash && stream.infoHash.length == 40) || stream.url) ) 
			return { code: 4, message: "a stream descriptor required in result of stream.*" };

		if (stream.infoHash && !stream.mapIdx)
			return { code: 5, message: "mapIdx (file id) required with infoHash in result of stream.*" };

		return false;
	},

	"meta.args": function(args) {

	},
	"meta": function(meta) {

	}
};