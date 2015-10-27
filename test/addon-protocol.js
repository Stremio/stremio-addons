var stremio = require("../");
var tape = require("tape");
var http = require("http");
var _ = require("lodash");

var NETWORK_TIMEOUT = 8000;

var TEST_SECRET = "51af8b26c364cb44d6e8b7b517ce06e39caf036a";

var addons = process.argv.filter(function(x) { return x.match("^http") });
if (! addons.length) throw "No add-ons specified";

var slackPush;
process.argv.forEach(function(x) { 
	if (x.match("--slack-push")) slackPush = x.split("=")[1];
});

addons.forEach(function(url) {
	var s = new stremio.Client({ timeout: NETWORK_TIMEOUT });
	s.add(url, { priority: 1 });
	s.setAuth(null, TEST_SECRET);

	tape("is available - fires addon-ready", function(t) {
		s.on("addon-ready", function(addon) {
			t.ok(addon && addon.url == url, "has proper url");
			t.end();
		});
	});

	tape("stats.get responds", function(t) {
		s.call("stats.get", {}, function(err, stats) {
			t.error(err, "has error");
			t.ok(stats.statsNum, "has statsNum");
			stats.stats.forEach(function(s) {
				t.notEqual(s.color || s.colour, "red", "square is not red"); 
			});
			t.end();
		});
	});

	// Test if an add-on implements the Stremio protocol OK and responds
	//tape("meta.find - get top 100 items")
	//tape("meta.find - collect genres")
	//tape("meta.find - particular genre")

	//tape("stream.find responds")
});