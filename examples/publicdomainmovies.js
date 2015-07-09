// this should be an add-on to http://www.publicdomaintorrents.info/nshowcat.html
// only stream.* methods, since each one is in IMDB and will be provided by Cinemeta

// this add-on does crawling of publicdomaintorrents.info and ranker.com and returns the data to Stremio

// use http://www.ranker.com/crowdranked-list/free-movies-the-best-films-in-the-public-domain for ranking

var services = require("../");

var central = "http://api8.herokuapp.com";

var server = new services.Server({
	"stream.get": function(args,cb,sess) { 
	},
	"stream.find": function(args,cb,sess) {
	},
        "stream.candidates": function(args, cb,sess) {
	}
}, { allow: central, secret: "51af8b26c364cb44d6e8b7b517ce06e39caf036a" }, {

});

var PORT = 6000;
var http = require("http");
http.createServer(function (req, res) {
  server.middleware(req,res,function(){ res.end() });
}).listen(PORT).on("listening", function()
{
        console.log("server listening at "+PORT);

});
