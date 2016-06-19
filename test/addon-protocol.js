var stremio = require("../");
var tape = require("tape");
var _ = require("underscore");
var async = require("async");

var NETWORK_TIMEOUT = 35*1000;

var TEST_SECRET = "51af8b26c364cb44d6e8b7b517ce06e39caf036a";

var addons = process.argv.filter(function(x) { return x.match("^http") });
if (! addons.length) throw "No add-ons specified";

var slackPush, slackChannel, slackMessage, noStats, shortLog;
process.argv.forEach(function(x) { 
	if (x.match("--slack-push")) slackPush = x.split("=")[1];
	if (x.match("--slack-channel")) slackChannel = x.split("=")[1];
	if (x.match("--slack-message")) slackMessage = x.split("=")[1];
	if (x.match("--no-stats")) noStats = true;
	if (x.match("--short-log")) shortLog = true;
});

var topitems = [], hasErr; // global, so we can test meta and stream add-ons at once

async.eachSeries(addons, function(url, ready) {
	var test = tape.createHarness();

	/* Send errors to Slack webhook
	 */
	var errors = 0, output = [];
	// WARNING: we can't do createStream more than once, because it bugs the first test
	test.createStream({ /* objectMode: true */ }).on("data", function(x) {
		if (x.match("^not ok")) { errors++; hasErr = true }
		output.push(x);
		process.stdout.write(x);
	}).on("end", function() {
		if (errors < 2) return ready();
		if (!slackPush) return ready();
				
		var body = require("querystring").stringify({ payload: JSON.stringify({ 
			channel: slackChannel || "#mon-stremio", username: "webhookbot",
			text: "*WARNING: "+url+" failing "+(slackMessage || "")+" with "+errors+" errors *\n",
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


	var s = new stremio.Client({ timeout: NETWORK_TIMEOUT });
	s.setAuth(null, TEST_SECRET);

	var LID;
	test("is available - fires addon-ready", function(t) {
		s.add(url, { priority: 1 });

		var timeout = setTimeout(function() { t.error("timed out"); t.end() }, 10000)

		s.once("addon-ready", function(addon) {
			clearTimeout(timeout);
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
	test("meta.find - get top 70 items", function(t) {
		if (!s.get("meta.find").length) { t.skip("no meta.find in this add-on"); return t.end(); }

		s.meta.find({ query: { type: "movie" }, limit: 70, sort: { popularity: -1 } }, function(err, meta) { 
			t.error(err);
			t.ok(meta, "has results");
			t.ok(meta && meta.length == 70, "70 items");
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
				var stream = streams && streams[0];
				
				if (! stream) return next(new Error("no stream"));

				t.ok(stream.hasOwnProperty("availability"), "has availability");
				t.ok(stream.availability > 0, "availability > 0");
				t.ok(stream.url || stream.yt_id || (stream.infoHash && stream.hasOwnProperty("mapIdx")), "has an HTTP / YouTube / BitTorrent stream");
				next();
			});

		}, function() { t.end() });
	});


	test("subtitles.get for top items of meta.find", function(t) {
		if (!s.get("subtitles.get").length) { t.skip("no subtitles.get in this add-on"); return t.end(); }
		if (! (topitems && topitems.length)) { t.skip("no topitems"); return t.end(); }

		async.eachSeries(topitems, function(item, next) {
			t.comment("trying "+item.name);
			s.subtitles.get({ 
				hash: item.type == "movie" ? item.imdb_id : item.imdb_id+" 1 1", 
				meta: item.type=="series" ?
				{ imdb_id: item.imdb_id, season: item.state.season, episode: item.state.episode } :
				{ imdb_id: item.imdb_id }
			}, function(err, resp) {
				t.error(err);
				t.ok(resp && resp.subtitles, "has subtitles");
				t.ok(resp && resp.hash, "has item hash");
				next();
			});
		}, function() { t.end() });
	});


	//test("meta.find - particular genre")
	//test("meta.find - returns valid results") // copy from filmon addon

}, function() {
	process.exit(hasErr ? 1 : 0);
});
