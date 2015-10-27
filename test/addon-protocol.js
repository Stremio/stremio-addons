var addons = require("../");
var tape = require("tape");
var http = require("http");
var _ = require("lodash");


var addons = process.argv.filter(function(x) { return x.match("^http") });
if (! addons.length) throw "No add-ons specified";

var slackPush;
process.argv.forEach(function(x) { 
	if (x.match("--slack-push")) slackPush = x.split("=")[1];
});

addons.forEach(function(addon) {

});
// Test if an add-on implements the Stremio protocol OK and responds
//tape("meta.find - get top 100 items")
//tape("meta.find - collect genres")
//tape("meta.find - particular genre")

//tape("stats.get responds")

//tape("stream.find responds")