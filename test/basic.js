var addons = require("../");
var tape = require("tape");
var http = require("http");
var extend = require("extend");

var TEST_SECRET = "51af8b26c364cb44d6e8b7b517ce06e39caf036a";

tape("server(methods, options, manifest)", function(t) {
	var server = new addons.Server({ "stream.find": function() { } }, { cacheTTL: { test: 1} }, { 
		name: "testing add-on", description: "add-on used for testing", version: "1.0.0",
		idProperty: "id",
		types: ["foo", "bar"],
		dontAnnounce: true,
	});

	t.ok(server.manifest, "has manifest");
	t.equals(server.manifest.name, "testing add-on", "has manifest name");
	t.ok(server.methods["stream.find"], "has method")
	t.ok(server.options.cacheTTL, "has options")
	t.end();
});


tape("server(methods, manifest)", function(t) {
	t.timeoutAfter(3000);

	var server = new addons.Server({ "stream.find": function() { } }, { 
		name: "testing add-on", description: "add-on used for testing", version: "1.0.0",
		idProperty: "id",
		types: ["foo", "bar"],
		dontAnnounce: true,
	});

	t.ok(server.manifest, "has manifest");
	t.equals(server.manifest.name, "testing add-on", "has manifest name");
	t.ok(server.methods["stream.find"], "has method")
	t.end();
});

function initServer(methods, callback, opts, manifest) {
	var manifest;
	var server = new addons.Server(methods, extend({ secret: TEST_SECRET  }, opts), manifest = manifest || { 
	 name: "testing add-on", description: "add-on used for testing", version: "1.0.0",
	 idProperty: "id",
	 types: ["foo", "bar"],
	 dontAnnounce: true,
	});

	var s = http.createServer(function (req, res) {
  		server.middleware(req,res,function(){ res.end() });
	}).listen().on("listening", function()
	{
		manifest.endpoint = "http://localhost:"+s.address().port+"/stremio/v1";
		callback("http://localhost:"+s.address().port);
	});

	server.s = s;
	return server;
}

tape("initialize server, landing page", function(t) {
	t.timeoutAfter(3000);

	var serv = initServer({ 
		"stats.get": function(args, cb, sess) {
			return cb(null, {});
		},
		"meta.find": function(args, cb, sess) {
			received = true;

			t.ok(args.query, "we are receiving arguments");
			t.ok(!!sess, "we have session");
			return cb(null, []);
		}
	},
	function(url) {
		http.get(url+"/stremio/v1", function(resp) {
			t.ok(resp, "has resp");
			t.ok(resp.statusCode === 200, "response finished with 200");
			serv.s.close(function() { t.end() })
		})
	});
});

tape("initialize server, basic call", function(t) {
	t.timeoutAfter(5000); // 5s because of slow auth

	var received = false;

	var serv = initServer({ 
		"meta.get": function(args, cb, sess) {
			received = true;

			t.ok(args.query.id == 1, "we are receiving arguments");
			t.ok(!!sess, "we have session");
			return cb(null, { now: Date.now() });
		}
	},
	function(url) {
		var s = new addons.Client({ picker: function(addons) { t.ok("picker called with 1 addon", addons.length==1); return addons } });
		s.add(url, null, function(err, addon) {
			t.ok(addon, "callback to .add"); 
			s.add(url, null, function(err, addon) {  t.ok(addon, "callback to .add - second time") });
		});
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
				serv.s.close(function() { t.end() })
			});
		});
	});
});


tape("initialize server, basic call - stremioget", function(t) {
	t.timeoutAfter(2000); 

	var received = false;

	var serv = initServer({ 
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
				serv.s.close(function() { t.end() })
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
			return cb(null, { now: Date.now() });
		}
	};
	var server = new addons.Server(methods, { }, { 
	 id: "org.test",
	 name: "testing add-on", description: "add-on used for testing", version: "1.0.0",
	 dontAnnounce: true,
	});

	var s = new addons.Client({ picker: function(addons) { t.ok("picker called with 1 addon", addons.length==1); return addons } });
	s.add(server, null, function(err, addon) {
		t.ok(addon, "callback to .add"); 
		s.add(server, null, function(err, addon) { t.ok(addon, "callback to .add - second time") });
	});
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

	var serv = initServer({ 
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
		s.call("meta.get", { query: { id: 1 } }, function(err, res)
		{
			t.ok(!err, "no err on call");
			t.ok(ready && ready.url && ready.url == url, "addon-ready was called with proper url");
			t.ok(picker && picker.addons && picker.addons.length == 1 && picker.method == "meta.get", "pick was called with 1 addon");
			t.ok(res, "has res");
			t.ok(!isNaN(res.now), "we have returned timestamp");
			serv.s.close(function() { t.end() })
		});
	});

});

tape("fallback if result is null", function(t) {
	t.timeoutAfter(2000);

	var serv1 = initServer({ 
		"stream.find": function(args, cb, sess) {
			return cb(null, null);
		}
	},
	function(url1) {
		var serv2 = initServer({ 
			"stream.find": function(args, cb, sess) {
				return cb(null, [{ infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223", availability: 2, now: Date.now(), from: "TWO" }]);
			}
		},
		function(url2) {
			var s = new addons.Client({ });
			s.add(url1, { priority: 0 });
			s.add(url2, { priority: 1 });
			s.stream.find({ query: { id: 1 } }, function(err, res)
			{
				t.ok(!err, "no err on call");
				res = res.reduce(function(a, b) { return a.concat(b) }, []);
				t.ok(res, "we have result");
				t.ok(res[0].from == "TWO", "we have results from two");
				serv1.s.close(function() { 
					serv2.s.close(function() { t.end() })
				})
			});
		});
	});
});

tape("fallback if network times out", function(t) {
	t.timeoutAfter(3000);

	var serv1 = initServer({ 
		"meta.find": function(args, cb, sess) {
		}
	},
	function(url1) {
		var serv2 = initServer({ 
			"meta.find": function(args, cb, sess) {
				return cb(null, [{ _id: "test" }, { _id: "test2" }])
			}
		},
		function(url2) {
			var s = new addons.Client({ timeout: 500 });
			s.add(url1, { priority: 0 });
			s.add(url2, { priority: 1 });
			s.meta.find({ query: { id: 1 } }, function(err, res)
			{
				t.ok(!err, "no err on call");
				t.ok(res, "we have result");
				t.ok(res && res.length==2, "we have items");
				serv1.s.close(function() { 
					serv2.s.close(function() { t.end() })
				})
			});
		});
	});
});


tape("intercept error from addon", function(t) {
	t.timeoutAfter(2000);

	var serv1 = initServer({ 
		"stream.find": function(args, cb, sess) {
			return cb(new Error("not supported"), null);
		}
	},
	function(url1) {
		var serv2 = initServer({ 
			"stream.find": function(args, cb, sess) {
				return cb(null, [{ infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223", availability: 2, now: Date.now(), from: "TWO" }]);
			}
		},
		function(url2) {
			var s = new addons.Client({ });
			s.add(url1, { priority: 1 });
			s.add(url2, { priority: 0 });
			s.stream.find({ query: { id: 1 } }, function(err, res)
			{
				t.ok(err, "we have an error");
				serv1.s.close(function() { 
					serv2.s.close(function() { t.end() })
				})
			});
		});
	});
});

tape("fallback on a network error, emit network-error event", function(t) {
	t.timeoutAfter(4000);

	var serv = initServer({ 
		"stream.find": function(args, cb, sess) {
			return cb(null, [{ infoHash: "ea53302184d1c63d8d6ad0517b2487eb6dd5b223", availability: 2, now: Date.now(), from: "ONE" }]);
		}
	},
	function(url1) {
		var emitted = false;

		var s = new addons.Client({ });
		s.add("http://dummy-dummy-dummy.du", { priority: 0 }); // wrong URL
		s.add(url1, { priority: 1 });
		
		s.on("network-error", function(err, addon, url) { 
			emitted = true; 
			t.ok(addon.url == url, "addon url returned"); 
			t.ok(addon.url == "http://dummy-dummy-dummy.du", "addon url correct"); 
		});

		s.stream.find({ query: { id: 1 } }, function(err, res, addon)
		{
			t.ok(!err, "no error");
			t.ok(res && res[0] && res[0].from == "ONE", "we have a result");
			t.ok(addon, "we have the picked addon");
			t.ok(addon.url == url1, "correct url to picked addon");
			//t.ok(emitted, "network-error emitted");
			serv.s.close(function() { t.end() });
		});
	});

});



tape("timeouts after opts.timeout time", function(t) {
	t.timeoutAfter(8000);

	var serv = initServer({ 
		"stream.find": function(args, cb, sess) {
			// wait to time-out
			setTimeout(function() { cb() }, 3000);
		}
	},
	function(url1) {
		var start = Date.now();
		var s = new addons.Client({ timeout: 1000 });
		s.add(url1, { priority: 1 });

		s.stream.find({ query: { id: 1 } }, function(err, res, addon)
		{
			t.ok((Date.now()-start)<=1100, "waited around 1 seconds");
			t.ok(err, "has error");
			serv.s.close(function() { t.end() });
		});
	});

});


tape("add-on priority", function(t) {
	t.skip("not implemented");
	t.end();
});


tape("checkArgs", function(t) { 
	var cli = new addons.Client({ });

	var checkArgs = cli.checkArgs;

	var manifest = { idProperty: "filmon_id", types: ["movie", "series"] };
	var manifestOld = { filter: { "query.filmon_id": { "$exists": true } } };

	t.ok(checkArgs({ }, { }) === 0,  "no matches - empty manifest");
	t.ok(checkArgs({}, { types: ["series", "movie"] }) === 0, "no matches");
	t.ok(checkArgs({ query: { type: "series" } }, manifest) === 1, "one match by type");
	t.ok(checkArgs({ query: { filmon_id: "something" } }, manifest) === 1, "one match by id");
	t.ok(checkArgs({ query: { id: "filmon_id:something" } }, manifest) === 1, "one match by id, with prefix");
	t.ok(checkArgs({ query: { filmon_id: "something", type: "movie" } }, manifest) === 2, "two matches");
	t.ok(checkArgs({ query: { filmon_id: "something" } }, manifestOld) === 1, "one match by id, old manifest");

	process.nextTick(function() { t.end(); });
});

tape("picks right add-on depending on checkArgs", function(t) {
	t.timeoutAfter(2000);

	var s = new addons.Client({ timeout: 1000 });

	var manifestCine = { idProperty: "imdb_id", types: ["movie", "series"] };
	var manifestFilmon = { idProperty: "filmon_id", types: ["movie", "series"] };
	var manifestYt = { idProperty: "yt_id", types: ["movie", "channel"] };

	var servers = [];

	var j = 0;
	[manifestFilmon, manifestYt, manifestCine].forEach(function(manifest, i, all) {
		servers.push(initServer({ "stream.find": function(args, cb, sess) {
			return cb(null, { url: "success", idProperty: manifest.idProperty });
		} }, function(url) {
			s.add(url, { priority: j }, function() {
			//s.add(url, { priority: 0 }, function() {
				if (++j === all.length) ready();
			})
		}, null, manifest));
	});

	function ready() {
		var j = 0;
		[manifestFilmon, manifestYt, manifestCine].forEach(function(manifest, i, all) {
			var q = { type: manifest.types[0], id: manifest.idProperty+":test" };
			s.stream.find({ query: q }, function(err, res) {
				t.error(err, "stream.find");
				t.ok(res, "has res");
				t.equals(res.idProperty, manifest.idProperty, "should be "+manifest.idProperty);
				if (++j === all.length) { t.end(); servers.forEach(function(s) { s.s.close() }) }
			})
		});

	}
});

