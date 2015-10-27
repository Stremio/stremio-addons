var stremio = require("../");
var tape = require("tape");
var http = require("http");
var _ = require("lodash");
var async = require("async");


// WARNING; it doens't appear tests run in parallel?!

var NETWORK_TIMEOUT = 8000;

var TEST_SECRET = "51af8b26c364cb44d6e8b7b517ce06e39caf036a";

var addons = process.argv.filter(function(x) { return x.match("^http") });
if (! addons.length) throw "No add-ons specified";

var slackPush;
process.argv.forEach(function(x) { 
	if (x.match("--slack-push")) slackPush = x.split("=")[1];
});

async.eachSeries(addons, function(url, ready) {
	var test = tape.createHarness();

	var s = new stremio.Client({ timeout: NETWORK_TIMEOUT });
	s.add(url, { priority: 1 });
	s.setAuth(null, TEST_SECRET);

	test(url+" is available - fires addon-ready", function(t) {
		s.on("addon-ready", function(addon) {
			t.ok(addon && addon.url == url, "has proper url");
			t.end();
		});
	});

	test(url+" stats.get responds", function(t) {
		s.call("stats.get", {}, function(err, stats) {
			t.error(err, "has error");
			t.ok(stats, "has results");
			t.ok(stats && stats.statsNum, "has statsNum");
			if (stats && stats.stats) stats.stats.forEach(function(s) {
				t.notEqual(s.color || s.colour, "red", "square is not red"); 
			});
			t.end();
		});
	});

	// Test if an add-on implements the Stremio protocol OK and responds
	//test("meta.find - get top 100 items")
	//test("meta.find - collect genres")
	//test("meta.find - particular genre")

	//test("stream.find responds")

	var hasErr = false, output = [];
	if (slackPush) test.createStream({ /* objectMode: true */ }).on("data", function(x) {
		if (x.match("^not ok")) hasErr = true;
		output.push(x);
		//if (x.hasOwnProperty("ok") && !x.ok) errors.push(x);
	}).on("end", function() {
		if (! hasErr) return;
		var body = "* "+url+" failing *\n```"+output.join("\n")+"```\n";
		console.log(body)
	});

	test.createStream()
		.on("end", ready) // test the next add-on
		.pipe(process.stdout); // pipe to stdout
});