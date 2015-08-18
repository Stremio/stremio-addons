var addons = require("../");
var tape = require("tape");
var http = require("http");

var TEST_SECRET = "51af8b26c364cb44d6e8b7b517ce06e39caf036a";

function initServer(methods, callback) {
	var server = new addons.Server(methods, { secret: TEST_SECRET }, { 
	 filter: { "query.id": { $exists: true }, "query.types": { $in: [ "foo", "bar" ] } }
	});

	var s = http.createServer(function (req, res) {
  		server.middleware(req,res,function(){ res.end() });
	}).listen().on("listening", function()
	{
		callback("http://localhost:"+s.address().port);
	});

	return server;
}

tape("initialize server, basic call, test events", function(t) {
	var received = false;

	initServer({ 
		"meta.get": function(args, cb, sess) {
			received = true;

			t.ok(args.query.id == 1, "we are receiving arguments");
			t.ok(!!sess, "we have session");
			t.ok(sess.isAnotherService, "we are calling from another service"); 
			return cb(null, { now: Date.now() });
		}
	},
	function(url) {
		var s = new addons.Client({ picker: function(addons) { t.ok("picker called with 1 addon", addons.length==1); return addons } });
		s.add(url);
		s.setAuth(null, TEST_SECRET);
		s.call("meta.get", { query: { id: 1 } }, function(err, res)
		{
			t.ok(!err, "no err on first call");
			t.ok(!isNaN(res.now), "we have returned timestamp");			
			t.ok(received, "call was received");

			// two calls because first will wait for central server authentication
			s.call("meta.get", { query: { id: 1 } }, function(err, res)
			{
				t.ok(!err, "no err on second call");
				t.ok(!isNaN(res.now), "we have returned timestamp");
				t.end();
			});
		});
	});

});

/* 
tape("picking an add-on depending on filter")
tape("picking an add-on depending on priority")
tape("calling all add-ons")
tape("falling back when addon result is null")
 */

/*
	// CLIENT
	var s = new addons.Client({ picker: function(addons) { console.log(addons.length+" addons"); return addons } });
	s.add("http://localhost:3009");
	s.setAuth(null, TEST_SECRET);
	s.call("meta.get", { query: { id: 1 } }, function(err, res)
	{
		console.log(err,res);
		s.call("meta.get", { query: { id: 1 } }, function(err, res)
		{
			console.log(err,res);
		});
	});

	s.on("pick", function(params) {
		console.log("pick emitted event with "+params.addons.length+" addons");
	})
*/