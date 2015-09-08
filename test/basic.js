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
	t.timeoutAfter(10000); // 5s because of slow auth

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
			return cb(null, { infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223", availability: 2, now: Date.now(), from: "ONE" });
		}
	},
	function(url1) {
		initServer({ 
			"stream.get": function(args, cb, sess) {
				return cb(null, { infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223", availability: 2, now: Date.now(), from: "TWO" });
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


tape("fallback if result is null", function(t) {
	t.timeoutAfter(2000);

	initServer({ 
		"stream.get": function(args, cb, sess) {
			return cb(null, null);
		}
	},
	function(url1) {
		initServer({ 
			"stream.get": function(args, cb, sess) {
				return cb(null, { infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223", availability: 2, now: Date.now(), from: "TWO" });
			}
		},
		function(url2) {
			var s = new addons.Client({ });
			s.add(url1, { priority: 0 });
			s.add(url2, { priority: 1 });
			s.setAuth(null, TEST_SECRET);
			s.stream.get({ query: { id: 1 } }, function(err, res)
			{
				t.ok(!err, "no err on call");
				t.ok(res, "we have result");
				t.ok(res.from == "TWO", "we have results from two");
				t.end();
			});
		});
	});
});


tape("intercept error from addon", function(t) {
	t.timeoutAfter(2000);

	initServer({ 
		"stream.get": function(args, cb, sess) {
			return cb(new Error("not supported"), null);
		}
	},
	function(url1) {
		initServer({ 
			"stream.get": function(args, cb, sess) {
				return cb(null, { infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223", availability: 2, now: Date.now(), from: "TWO" });
			}
		},
		function(url2) {
			var s = new addons.Client({ });
			s.add(url1, { priority: 0 });
			s.add(url2, { priority: 1 });
			s.setAuth(null, TEST_SECRET);
			s.stream.get({ query: { id: 1 } }, function(err, res)
			{
				t.ok(err, "we have an error");
				t.end();
			});
		});
	});
});

tape("fallback on a network error, emit network-error event", function(t) {
	t.timeoutAfter(4000);

	initServer({ 
		"stream.get": function(args, cb, sess) {
			return cb(null, { infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223", availability: 2, now: Date.now(), from: "ONE" });
		}
	},
	function(url1) {
		var emitted = false;

		var s = new addons.Client({ });
		s.add("http://dummy-dummy-dummy.du", { priority: 0 }); // wrong URL
		s.add(url1, { priority: 1 });
		s.setAuth(null, TEST_SECRET);
		
		/*
		s.on("network-error", function(addon, url) { 
			emitted = true; 
			t.ok(addon.url == url, "addon url returned"); 
			t.ok(addon.url == url1, "addon url correct"); 
		});
		*/

		s.stream.get({ query: { id: 1 } }, function(err, res, addon)
		{
			t.ok(!err, "no error");
			t.ok(res && res.from == "ONE", "we have a result");
			t.ok(addon, "we have the picked addon");
			t.ok(addon.url == url1, "correct url to picked addon");
			//t.ok(emitted, "network-error emitted");
			t.end();
		});
	});

});



/* 
tape("picking an add-on depending on filter")
tape("picking an add-on depending on priority")
tape("calling all add-ons")
tape("falling back when addon result is null")
 */

var validation = require("../validation");

tape("validation - stream arguments", function(t) {
	t.ok(validation.stream_args({ infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223"} ) === false, "valid with infoHash");
	t.ok(validation.stream_args({ query: { imdb_id: "tt0032138" } } ) === false, "valid with query");
	t.ok(validation.stream_args({ test: { imdb_id: "tt0032138" } } ).code == 0, "invalid args");
	t.end();
});

tape("validation - stream results", function(t) {
	t.ok(validation.stream({ test: "http://test" }).code === 3, "invalid - no availability");
	t.ok(validation.stream({ availability: 3, infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223", mapIdx: 0 } ) === false, "valid with infoHash / mapIdx");
	t.ok(validation.stream({ availability: 3, infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223" } ).code === 5, "invalid with infoHash");
	t.ok(validation.stream({ availability: 3, url: "http://test" }) === false, "valid with url");
	t.ok(validation.stream({ availability: 3, test: "http://test" }).code === 4, "invalid");
	t.end();
});



tape("stream.get validation", function(t) {
	t.timeoutAfter(2000);

	initServer({ 
		"stream.get": function(args, cb, sess) {
			return cb(null, { now: Date.now() });
		}
	},
	function(url) {
		var s = new addons.Client({ });

		s.add(url);
		s.setAuth(null, TEST_SECRET);
		s.call("stream.get", { test: "weqew" }, function(err, res)
		{
			t.ok(err, "there is error");
			t.ok(err.code === 0, "error code is correct");
			t.end();
		});
	});
});

tape("stream.find validation", function(t) {
	t.timeoutAfter(2000);

	initServer({ 
		"stream.get": function(args, cb, sess) {
			return cb(null, { now: Date.now() });
		}
	},
	function(url) {
		var s = new addons.Client({ });

		s.add(url);
		s.setAuth(null, TEST_SECRET);
		s.call("stream.find", [{ test: "weqew" }], function(err, res)
		{
			t.ok(err, "there is error");
			t.ok(err.code === 0, "error code is correct");
			t.end();
		});
	});
});

tape("add-on priority", function(t) {
	t.skip("not implemented")
})
