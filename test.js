var services = require("./");

// SERVER
var server = new services.Server({
	"meta.get": function(args, cb) {
		console.log("received args -> "+args);
		return cb(null, { now: Date.now() });
	}
});
server.listen(3009);;

// CLIENT
var s new services.Client();
s.addService("http://localhost:3009");
s.call("meta.get", { id: 1 }, function(err, res)
{
	console.log(err,res);
});

