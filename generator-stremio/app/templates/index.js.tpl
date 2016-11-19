var Stremio = require("stremio-addons");

// Enable server logging for development purposes
process.env.STREMIO_LOGGING = true; 

// Define manifest object
var manifest = { 
    // See https://github.com/Stremio/stremio-addons/blob/master/docs/api/manifest.md for full explanation
    "id": "org.stremio.<%= id %>",
    "version": "1.0.0",

    "name": "<%= name %>",
    "description": "<%= description %>",
    "icon": "<%= icon %>", 
    "background": "<%= background %>",

    // Properties that determine when Stremio picks this add-on
    "types": <%- types %>, // your add-on will be preferred for those content types
    "idProperty": <%- idProperty %>, // the property to use as an ID for your add-on; your add-on will be preferred for items with that property; can be an array
    // We need this for pre-4.0 Stremio, it's the obsolete equivalent of types/idProperty
    "filter": { "query.imdb_id": { "$exists": true }, "query.type": { "$in":<%- types %> } },

    // Needs to point to an HTTP(S) link where you hosted your add-on, when it's ready
    // For hosting, see https://github.com/Stremio/stremio-addons/blob/master/docs/tutorial/hosting.md 
    "endpoint": ""
};

var methods = { };

var addon = new Stremio.Server({
    "stream.find": function(args, callback, user) {
        // callback expects array of stream objects
    },
    "meta.find": function(args, callback, user) {
        // callback expects array of meta object (primary meta feed)
        // it passes "limit" and "skip" for pagination
    },
    "meta.get": function(args, callback, user) {
        // callback expects one meta element
    },
    "meta.search": function(args, callback, user) {
        // callback expects array of search results with meta objects
        // does not support pagination
    },
}, manifest);

if (module.parent) {
    module.exports = addon
} else {
    var server = require("http").createServer(function (req, res) {
        addon.middleware(req, res, function() { res.end() }); // wire the middleware - also compatible with connect / express
    }).on("listening", function()
    {
        console.log("Sample Stremio Addon listening on "+server.address().port);
    }).listen(process.env.PORT || 7000);
}

// Sample data
var dataset = {
    // youtube example
    "tt0031051": { yt_id: "m3BKVSpP80s", availability: 2 }, // The Arizona Kid, 1939; YouTube stream

    // direct link example
    "tt1254207": { url: "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4", availability: 1 }, // big buck bunny, HTTP stream

    // external link example
    "tt0137523": { externalUrl: "https://www.netflix.com/watch/26004747" }, // Fight Club, 1999; redirect to Netflix

    // torrent example
    "tt0017136": { infoHash: "dca926c0328bb54d209d82dc8a2f391617b47d7a", mapIdx: 1, availability: 2 }, // metropolis, 1927
};


// Sample methods

// Streaming
methods["stream.find"] = function(args, callback) {
    if (! args.query) return callback();

    //callback(null, [dataset[args.query.imdb_id]]); // Works only for movies
    
    var key = [args.query.imdb_id, args.query.season, args.query.episode].filter(function(x) { return x }).join(" ");
    callback(null, [dataset[key]]);
};

// Add sorts to manifest, which will add our own tab in sorts
manifest.sorts = [{prop: "popularities.helloWorld", name: "Hello World",types:["movie","series"]}];

// To provide meta for our movies, we'll just proxy the official cinemeta add-on
var client = new Stremio.Client();
client.add("http://cinemeta.strem.io/stremioget/stremio/v1");

// Proxy Cinemeta, but get only our movies
// That way we get a tab "Hello World" with the movies we provide :) 
methods["meta.find"] = function(args, callback) {
    var ourImdbIds = Object.keys(dataset).map(function(x) { return x.split(" ")[0] });
    args.query = args.query || { };
    args.query.imdb_id = args.query.imdb_id || { $in: ourImdbIds };
    client.meta.find(args, function(err, res) {
    if (err) console.error(err);
        callback(err, res ? res.map(function(r) { 
            r.popularities = { helloWorld: 10000 }; // we sort by popularities.helloWorld, so we should have a value
            return r;
        }) : null);
    });
}
