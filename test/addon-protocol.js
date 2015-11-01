var stremio = require("../");
var tape = require("tape");
var _ = require("lodash");
var async = require("async");

var NETWORK_TIMEOUT = 15*1000;

var TEST_SECRET = "51af8b26c364cb44d6e8b7b517ce06e39caf036a";

var addons = process.argv.filter(function(x) { return x.match("^http") });
if (! addons.length) throw "No add-ons specified";

var slackPush, slackChannel, noStats;
process.argv.forEach(function(x) { 
	if (x.match("--slack-push")) slackPush = x.split("=")[1];
	if (x.match("--slack-channel")) slackChannel = x.split("=")[1];
	if (x.match("--no-stats")) noStats = true;
});

var hasErr = false, output = [];

var topitems = []; // global, so we can test meta and stream add-ons at once

async.eachSeries(addons, function(url, ready) {
	var test = tape.createHarness();

	var s = new stremio.Client({ timeout: NETWORK_TIMEOUT });
	s.add(url, { priority: 1 });
	s.setAuth(null, TEST_SECRET);

	test("simple http request", function(t) {
		var req = require("http").request(require("url").parse(url), function(resp) {
			t.ok(resp, "has response");
			t.end();
		}).on("error", function(err) {
			t.error(err);
			t.end();
		}).on("timeout", function() { t.error("network timeout"); t.end() });
		req.setTimeout(15000);	
	});

	var LID;
	test("is available - fires addon-ready", function(t) {
		t.comment("Testing "+url);
		s.on("addon-ready", function(addon) {
			t.ok(addon && addon.url == url, "has proper url");
			if (addon.manifest.stremio_LID) LID = addon.manifest.stremio_LID; 
			t.end();
		});
	});

	test("stats.get responds", function(t) {
		if (noStats) { t.skip("--no-stats"); t.end(); return }
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

	// Test if an add-on implements the Stremio protocol OK and responds
	test("meta.find - get top 100 items", function(t) {
		if (!s.get("meta.find").length) { t.skip("no meta.find in this add-on"); return t.end(); }

		s.meta.find({ query: { type: "movie" }, limit: 100, sort: { popularity: -1 } }, function(err, meta) { 
			t.error(err);
			t.ok(meta, "has results");
			t.ok(meta && meta.length == 100, "100 items");
			topitems = meta ? meta.filter(function(x) { 
				return LID ? (x.popularities && x.popularities[LID]) : x.popularity 
			}).slice(0, 15) : topitems;
			t.ok(topitems.length, "has popular items");
			t.end();
		});
	});
	
	test("meta.find - collect genres", function(t) {
		if (!s.get("meta.find").length) { t.skip("no meta.find in this add-on"); return t.end(); }

		s.meta.find({ query: { }, limit: 500, projection: { genre: 1 }, sort: { popularity: -1 } }, function(err, meta) { 
			t.error(err);
			t.ok(meta, "has results");
			var genres = { };
			if (meta) meta.forEach(function(x) { x.genre && x.genre.forEach(function(g) { genres[g] = 1 }) });
			t.ok(Object.keys(genres).length > 3, "more than 3 genres");
			t.end();
		});
	});

	test("stream.find for top items of meta.find", function(t) {
		if (!s.get("stream.find").length) { t.skip("no stream.find in this add-on"); return t.end(); }
		if (! (topitems && topitems.length)) { t.skip("no topitems"); return t.end(); }

		async.eachSeries(topitems, function(item, next) {
			t.comment("trying "+item.name);
			s.stream.find({ query: _.pick(item, "imdb_id", "yt_id", "filmon_id", "type") }, function(err, streams) {
				t.error(err);
				t.ok(streams && streams.length, "has streams");
				var stream = streams[0];
				
				if (! stream) return next(new Error("no stream"));

				t.ok(stream.hasOwnProperty("availability"), "has availability");
				t.ok(stream.availability > 0, "availability > 0");
				t.ok(stream.url || stream.yt_id || (stream.infoHash && stream.hasOwnProperty("mapIdx")), "has an HTTP / YouTube / BitTorrent stream");
				next();
			});

		}, function() { t.end() });
	});

	//test("meta.find - particular genre")
	//test("meta.find - returns valid results") // copy from filmon addon

	/* Send errors to Slack webhook
	 */
	test.createStream({ /* objectMode: true */ }).on("data", function(x) {
		if (x.match("^not ok")) hasErr = true;
		output.push(x);
		//if (x.hasOwnProperty("ok") && !x.ok) errors.push(x);
	}).on("end", function() {
		if (! hasErr) return ready();
		if (!slackPush) return ready();

		var body = require("querystring").stringify({ payload: JSON.stringify({ 
			channel: slackChannel || "#mon-stremio", username: "webhookbot",
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
	process.exit(hasErr ? 1 : 0);
});
