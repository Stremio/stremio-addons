var services = require("./");

// SERVER
var server = new services.Server({
	"meta.get": function(args, cb) {
		console.log("received args -> "+args);
		return cb(null, { now: Date.now() });
	}
});

var http = require("http");
http.createServer(function (req, res) {
  server.middleware(req,res,function(){ res.end() });
}).listen(3009).on("listening", function()
{
	console.log("server listening...");

	// CLIENT
	var s = new services.Client();
	s.addService("http://localhost:3009");
	s.call("meta.get", { id: 1 }, function(err, res)
	{
		console.log(err,res);
	});

});


