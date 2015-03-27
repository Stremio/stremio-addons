var services = require("./");

//var central = "http://localhost:3008";
var central = "http://api8.herokuapp.com";

// SERVER
var server = new services.Server({
	"meta.get": function(args, cb, sess) {
		console.log("received args -> ",args," from ", sess);
		return cb(null, { now: Date.now() });
	}
}, { allow: central, secret: "51af8b26c364cb44d6e8b7b517ce06e39caf036a" }, { 
 filter: { id: { $exists: true }, types: { $in: [ "foo", "bar" ] } }
});

var http = require("http");
http.createServer(function (req, res) {
  server.middleware(req,res,function(){ res.end() });
}).listen(3009).on("listening", function()
{
	console.log("server listening...");

	// CLIENT
	var s = new services.Client({ picker: function(services) { return services } });
	s.addService("http://localhost:3009");
	s.setAuth(central, "51af8b26c364cb44d6e8b7b517ce06e39caf036a");
	s.call("meta.get", { id: 1 }, function(err, res)
	{
		console.log(err,res);
		s.call("meta.get", { id: 1 }, function(err, res)
		{
			console.log(err,res);
		});
	});
});


