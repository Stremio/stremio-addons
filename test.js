var services = require("./");

// SERVER
var server = new services.Server({
	"meta.get": function(args, cb) {
		console.log("received args -> ",args);
		return cb(null, { now: Date.now() });
	}
}, { allow: "http://api.linvo.me", secret: "51af8b26c364cb44d6e8b7b517ce06e39caf036a" });

var http = require("http");
http.createServer(function (req, res) {
  server.middleware(req,res,function(){ res.end() });
}).listen(3009).on("listening", function()
{
	console.log("server listening...");

	// CLIENT
	var s = new services.Client({ picker: function(services) { return services } });
	s.addService("http://localhost:3009");
	s.setAuth("http://api.linvo.me", "51af8b26c364cb44d6e8b7b517ce06e39caf036a");
	s.call("meta.get", { id: 1 }, function(err, res)
	{
		console.log(err,res);
	});
});


