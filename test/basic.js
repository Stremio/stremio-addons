var addons = require("../");
var tape = require("tape");
var http = require("http");
var _ = require("lodash");

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

tape("initialize server, basic call", function(t) {
	t.timeoutAfter(2000);

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


tape("test events", function(t) {
	t.timeoutAfter(2000);

	initServer({ 
		"meta.get": function(args, cb, sess) {
			return cb(null, { now: Date.now() });
		}
	},
	function(url) {
		var s = new addons.Client({ picker: function(addons) { t.ok("picker called with 1 addon", addons.length==1); return addons } });
		
		var ready, picker;
		s.on("addon-ready", function(addon) { ready = addon });
		s.on("pick", function(params) { picker = params });

		s.add(url);
		s.setAuth(null, TEST_SECRET);
		s.call("meta.get", { query: { id: 1 } }, function(err, res)
		{
			t.ok(!err, "no err on call");
			t.ok(ready && ready.url && ready.url == url, "addon-ready was called with proper url");
			t.ok(picker && picker.addons && picker.addons.length == 1 && picker.method == "meta.get", "pick was called with 1 addon");
			t.ok(!isNaN(res.now), "we have returned timestamp");
			t.end();
		});
	});

});


tape("callEvery", function(t) {
	t.timeoutAfter(2000);

	initServer({ 
		"stream.get": function(args, cb, sess) {
			return cb(null, { now: Date.now(), from: "ONE" });
		}
	},
	function(url1) {
		initServer({ 
			"stream.get": function(args, cb, sess) {
				return cb(null, { now: Date.now(), from: "TWO" });
			}
		},
		function(url2) {
			var s = new addons.Client({ });
			s.add(url1);
			s.add(url2);
			s.setAuth(null, TEST_SECRET);
			s.callEvery("stream.get", { query: { id: 1 } }, function(err, res)
			{
				t.ok(!err, "no err on call");
				t.ok(res.length == 2, "2 results");
				t.ok(_.findWhere(res, { from: "ONE" }), "we have results from one");
				t.ok(_.findWhere(res, { from: "TWO" }), "we have results from two");
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
