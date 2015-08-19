What are Stremio Add-ons
==================================

A Stremio Addon, unlike similar concepts (plugins for XBMC or channels for Plex) communicates with Stremio **through HTTP and is hosted by the Add-on provider**, instead of running inside the app itself.
The reasons for this are:
* Easy way for the user to enable the Add-on, just by activating an Addon at a given URL
* Security, no extra code running inside Stremio
* Simpler overall architecture - if the data you're providing to Stremio lies on your servers, the Add-on server can reach it directly and give it to clients

Potential issues
* Offline use - this is handled in Stremio by caching the catalogue, your personal library and watched streams (limited cache set by the user); as an Add-on creator, you don't need to worry about this

Creating a Stremio Add-on
========================
1. To create a Stremio Add-on, you need to implement the Add-on protocol first - or use a ready solution for Node.js - [stremio-addons](http://github.com/Stremio/stremio-addons).
2. Think of the Add-on details - name, description, version, hints
3. Implement one or more of the following methods: ``stream.get``, ``stream.find``, ``meta.get``, ``meta.find``, ``meta.search`` which Stremio is going to use

Here's a sample Add-on that will provide BitTorrent streams for a few public domain movies:
```javascript
var Stremio = require("../");
var stremioCentral = "http://api8.herokuapp.com";
var mySecret = "your secret"; 

var manifest = { 
    "name": "Example Addon",
    "description": "Sample addon providing a few public domain movies",
    "id": "org.stremio.basic",
    "version": "1.0.0",
    "types": ["movie"],
    "filter": { "infoHash": { "$exists": true }, "query.imdb_id": { "$exists": true }, "query.type": { "$in":["series","movie"] } }
};

var dataset = {
    "tt0063350": { infoHash: "f17fb68ce756227fce325d0513157915f5634985", mapIdx: 0, availability: 2 }, // night of the living dead, 1968
    "tt0032138": { infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e", mapIdx: 0, availability: 2 }, // the wizard of oz 1939
    "tt0017136": { infoHash: "dca926c0328bb54d209d82dc8a2f391617b47d7a", mapIdx: 1, availability: 2 }, // metropolis, 1927; first file is a .rar, second is streamable
    "tt0051744": { infoHash: "9f86563ce2ed86bbfedd5d3e9f4e55aedd660960", mapIdx: 0, availability: 2 }, // house on haunted hill 1959
    "tt1254207": { url: "http://clips.vorwaerts-gmbh.de/big_buck_bunny.mp4", availability: 1 }, // big buck bunny, HTTP stream
};

var addon = new Stremio.Server({
    "stream.get": function(args, callback, user) {
        if (! args.query) return callback();
        return callback(null, dataset[args.query.imdb_id] ? dataset[args.query.imdb_id] : null);
    },
    "stream.find": function(args, callback, user) {
        callback(null, { items: args.items.map(function(x) { 
            return dataset[x.query.imdb_id] ? { availability: dataset[x.query.imdb_id].availability } : null }) 
        });
    }
}, { /* secret: mySecret */ }, manifest);

var server = require("http").createServer(function (req, res) {
    addon.middleware(req, res, function() { res.end() }); // wire the middleware - also compatible with connect / express
}).on("listening", function()
{
    console.log("Sample Stremio Addon listening on "+server.address().port);
}).listen(process.env.PORT || 7000);
```


#### You can see a real-world example of a Stremio Add-on here: https://github.com/Ivshti/multipass-torrent/blob/master/stremio-addon/addon.js
