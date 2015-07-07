// For now, the plan is to make an Add-on for vodo.net

// Also consider Miro ?


var services = require("../");

var central = "http://api8.herokuapp.com";

var server = new services.Server({
        "meta.get": function(args, cb, sess) {
                console.log("received args -> ",args," from ", sess);
                return cb(null, { now: Date.now() });
        },
        "meta.find": function(args,cb,sess) {
        },
	"stream.get": function(args,cb,sess) { 
	},
	"stream.find": function(args,cb,sess) {
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
