var stremio = require("../");
var tape = require("tape");
var _ = require("lodash");
var async = require("async");

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

	test("simple http request", function(t) {
		require("http").request(require("url").parse(url), function(resp) {
			t.ok(resp, "has response");
			t.end();
		}).on("error", function(err) {
			t.error(err);
			t.end();
		});
	});

	test("is available - fires addon-ready", function(t) {
		t.comment("Testing "+url);
		s.on("addon-ready", function(addon) {
			t.ok(addon && addon.url == url, "has proper url");
			t.end();
		});
	});

	test("stats.get responds", function(t) {
		s.call("stats.get", { }, function(err, stats) {
			t.error(err, "has error");
			t.ok(stats, "has results");
			t.ok(stats && stats.statsNum, "has statsNum");
			if (stats && stats.stats) stats.stats.forEach(function(s) {
				t.notEqual(s.color || s.colour, "red", "square "+s.name+" is not red"); 
			});
			t.end();
		});
	});

	// TODO: stream.find
	//test("stream.find responds") // copy from somewhere else; test .url || .yt_id || (.infoHash && .hasOwnProperty('mapIdx'))

	// Test if an add-on implements the Stremio protocol OK and responds
	test("meta.find - get top 100 items", function(t) {
		if (!s.get("meta.find").length) { t.skip("no meta.find in this add-on"); return t.end(); }

		s.meta.find({ query: { }, limit: 100 }, function(err, meta) { 
			t.error(err);
			t.ok(meta, "has results");
			t.ok(meta && meta.length == 100, "100 items");
			if (meta && s.get("stream.find").length) {
				t.comment("testing stream.find for the same catalogue");
				//meta.slice(0, 10).
			} else {
				t.end();
			}
		});
	});
	
	test("meta.find - collect genres", function(t) {
		if (!s.get("meta.find").length) { t.skip("no meta.find in this add-on"); return t.end(); }

		s.meta.find({ query: { }, limit: 500 }, function(err, meta) { 
			t.error(err);
			t.ok(meta, "has results");
			var genres = { };
			if (meta) meta.forEach(function(x) { x.genre && x.genre.forEach(function(g) { genres[g] = 1 }) });
			t.ok(Object.keys(genres).length > 3, "more than 3 genres");
			t.end();
		});
	});

	//test("meta.find - particular genre")
	//test("meta.find - returns valid results") // copy from filmon addon

	/* Send errors to Slack webhook
	 */
	var hasErr = false, output = [];
	if (slackPush) test.createStream({ /* objectMode: true */ }).on("data", function(x) {
		if (x.match("^not ok")) hasErr = true;
		output.push(x);
		//if (x.hasOwnProperty("ok") && !x.ok) errors.push(x);
	}).on("end", function() {
		if (! hasErr) return ready();

		var body = require("querystring").stringify({ payload: JSON.stringify({ 
			channel: "#mon-stremio", username: "webhookbot",
			text: "*WARNING: "+url+" failing*\n```"+output.join("\n")+"```\n",
			icon_emoji: ":bug:"
		}) });

		console.log("Sending errors to slack");
		var req = require("https").request(_.extend(require("url").parse(slackPush), { 
			headers: { "Content-Type": "application/x-www-form-urlencoded", "Content-Length": body.length },
			method: "POST"
		}), function() {
			console.log("Sent errors to slack");
			ready();
		});
		req.write(body);
		req.end();
	});

	/* Default stream
	 */
	console.log("\n\n");
	test.createStream().pipe(process.stdout); // pipe to stdout
}, function() {
	process.exit();
});