var addons = require("../");
var tape = require("tape");
var http = require("http");
var _ = require("lodash");

var TEST_SECRET = "51af8b26c364cb44d6e8b7b517ce06e39caf036a";

function initServer(methods, callback, opts) {
	var manifest;
	var server = new addons.Server(methods, _.extend({ secret: TEST_SECRET  }, opts), manifest = { 
	 name: "testing add-on", description: "add-on used for testing", version: "1.0.0",
	 filter: { "query.id": { $exists: true }, "query.types": { $in: [ "foo", "bar" ] } }
	});

	var s = http.createServer(function (req, res) {
  		server.middleware(req,res,function(){ res.end() });
	}).listen().on("listening", function()
	{
		manifest.endpoint = "http://localhost:"+s.address().port+"/stremio/v1";
		callback("http://localhost:"+s.address().port);
	});

	return server;
}

tape("initialize server, landing page", function(t) {
	t.timeoutAfter(3000);

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
		http.get(url+"/stremio/v1", function(resp) {
			t.ok(resp, "has resp");
			t.ok(resp.statusCode === 200, "response finished with 200");
			t.end();
		})
	});
});


tape("initialize server, basic call", function(t) {
	t.timeoutAfter(5000); // 5s because of slow auth

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
		s.add(url, null, function(err, addon) {
			t.ok(addon, "callback to .add"); 
			s.add(url, null, function(err, addon) {  t.ok(addon, "callback to .add - second time") });
		});
		s.setAuth(null, TEST_SECRET);
		s.call("meta.get", { query: { id: 1 } }, function(err, res)
		{
			t.error(err, "no err on first call");
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

tape("initialize server, basic call - stremioget", function(t) {
	t.timeoutAfter(2000); 

	var received = false;

	initServer({ 
		"meta.get": function(args, cb, sess) {
			received = true;

			t.ok(args.query.id == 1, "we are receiving arguments");
			t.ok(!!sess, "we have session");
			//t.ok(sess.isAnotherService, "we are calling from another service"); // no auth when we're stremioget
			return cb(null, { now: Date.now() });
		}
	},
	function(url) {
		var s = new addons.Client({ picker: function(addons) { t.ok("picker called with 1 addon", addons.length==1); return addons } });
		s.add(url+"/stremioget");
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
	}, { stremioget: true });

});


tape("local basic call", function(t) {
	t.timeoutAfter(5000); // 5s because of slow auth

	var received = false;

	var methods = {
		"meta.get": function(args, cb, sess) {
			received = true;

			t.ok(args.query.id == 1, "we are receiving arguments");
			t.ok(!!sess, "we have session");
			t.ok(sess.isAnotherService, "we are calling from another service"); 
			return cb(null, { now: Date.now() });
		}
	};
	var server = new addons.Server(methods, { }, { 
	 id: "org.test",
	 name: "testing add-on", description: "add-on used for testing", version: "1.0.0",
	 filter: { "query.id": { $exists: true }, "query.types": { $in: [ "foo", "bar" ] } }
	});

	var s = new addons.Client({ picker: function(addons) { t.ok("picker called with 1 addon", addons.length==1); return addons } });
	s.add(server, null, function(err, addon) {
		t.ok(addon, "callback to .add"); 
		s.add(server, null, function(err, addon) {  t.ok(addon, "callback to .add - second time") });
	});
	s.setAuth(null, TEST_SECRET);
	s.call("meta.get", { query: { id: 1 } }, function(err, res)
	{
		t.error(err, "no err on first call");
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

tape("test events", function(t) {
	t.timeoutAfter(3000);

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
			t.ok(res, "has res");
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


tape("debounced batching test", function(t) {
	t.timeoutAfter(2000);

	var j = 0;
	var called = 0;

	initServer({ 
		"stream.test": function(args, cb, sess) {
			t.ok(j == 5, "is batched");
			cb(null, { infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223", availability: 2, now: Date.now(), from: "ONE" });
			if (++called == 5) t.end();
		}
	},
	function(url1) {
		var s = new addons.Client({ });
		s.add(url1);
		s.setAuth(null, TEST_SECRET);
		s.setBatchingDebounce("stream.test", 300);

		[1,2,3,4,5].forEach(function(i) {
			setTimeout(function() {
				j = i;
				s.call("stream.test", { query: { id: 1 } }, function(err, res)
				{
					t.ok(!err, "no err on call");
				});
			}, i*50);
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

tape("fallback if network times out", function(t) {
	t.timeoutAfter(3000);

	initServer({ 
		"meta.find": function(args, cb, sess) {
		}
	},
	function(url1) {
		initServer({ 
			"meta.find": function(args, cb, sess) {
				return cb(null, [{ _id: "test" }, { _id: "test2" }])
			}
		},
		function(url2) {
			var s = new addons.Client({ timeout: 500 });
			s.add(url1, { priority: 0 });
			s.add(url2, { priority: 1 });
			s.setAuth(null, TEST_SECRET);
			s.meta.find({ query: { id: 1 } }, function(err, res)
			{
				t.ok(!err, "no err on call");
				t.ok(res, "we have result");
				t.ok(res && res.length==2, "we have items");
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
		
		s.on("network-error", function(err, addon, url) { 
			emitted = true; 
			t.ok(addon.url == url, "addon url returned"); 
			t.ok(addon.url == "http://dummy-dummy-dummy.du", "addon url correct"); 
		});

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



tape("timeouts after opts.timeout time", function(t) {
	t.timeoutAfter(4000);

	initServer({ 
		"stream.get": function(args, cb, sess) {
			// wait to time-out
		}
	},
	function(url1) {
		var start = Date.now();
		var s = new addons.Client({ timeout: 1000 });
		s.add(url1, { priority: 1 });
		s.setAuth(null, TEST_SECRET);

		s.stream.get({ query: { id: 1 } }, function(err, res, addon)
		{
			t.ok((Date.now()-start)>=1000, "waited 2 seconds");
			t.ok(err, "has error");
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
	//t.skip("validation disabled"); return t.end();

	t.ok(validation.stream_args({ infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223"} ) === false, "valid with infoHash");
	t.ok(validation.stream_args({ query: { imdb_id: "tt0032138" } } ) === false, "valid with query");
	t.ok(validation.stream_args({ test: { imdb_id: "tt0032138" } } ).code == 0, "invalid args");
	t.end();
});

tape("validation - stream results", function(t) {
        //t.skip("validation disabled"); return t.end();

	t.ok(validation.stream({ test: "http://test" }).code === 3, "invalid - no availability");
	t.ok(validation.stream({ availability: 3, infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223", mapIdx: 0 } ) === false, "valid with infoHash / mapIdx");
	t.ok(validation.stream({ availability: 3, infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223" } ).code === 5, "invalid with infoHash");
	t.ok(validation.stream({ availability: 3, url: "http://test" }) === false, "valid with url");
	t.ok(validation.stream({ availability: 3, test: "http://test" }).code === 4, "invalid");
	t.end();
});




tape("stream.get validation", function(t) {
	t.timeoutAfter(2000);
    t.skip("validation disabled"); return t.end();


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

    t.skip("validation disabled"); return t.end();
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
	t.skip("not implemented");
	t.end();
});

tape("checkArgs", function(t) { 
	var checkArgs = (new addons.Client({ })).checkArgs;

	var f = { "query.id": { $exists: true }, "query.type": { $in: ["foo", "bar"] }, toplevel: { $exists: true } };
	t.ok(checkArgs({ toplevel: 5 }, f) == true, "basic top-level match");
	t.ok(checkArgs({ query: { id: 2 } }, f) == true, "nested on one level with $exists");
	t.ok(checkArgs({ "query.id": 2 }, f) == true, "passing flat dot property with $exists");
	t.ok(checkArgs({ query: { type: "foo" } }, f) == true, "nested with $in");
	t.ok(checkArgs({ query: { type: "bar" } }, f) == true, "nested with $in");
	t.ok(checkArgs({ query: { type: ["bar"] } }, f) == true, "nested with an array with $in");
	t.ok(checkArgs({ query: { type: "somethingelse" } }, f) == false, "nested with $in - not matching");
	t.ok(checkArgs({ query: {} }, f) == false, "nested - not matching");
	t.ok(checkArgs({ query: { idx: 5 } } , f) == false, "nested - not maching");

	process.nextTick(function() { t.end(); });
});
