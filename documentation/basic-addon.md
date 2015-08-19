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
var Stremio = require("stremio-addons");
var stremioCentral = "http://api8.herokuapp.com";
var mySecret = null; // "your secret"; // pass null to use default testing secret

var manifest = { 
    "name": "Example Addon",
    "description": "Sample addon providing a few public domain movies",
    "id": "org.stremio.basic",
    "version": "1.0.0",
    "types": ["movie"]
};

var dataset = {
    "tt0063350": "f17fb68ce756227fce325d0513157915f5634985", // night of the living dead, 1968
    "tt0032138": "24c8802e2624e17d46cd555f364debd949f2c81e", // the wizard of oz 1939
    "tt0017136": "dca926c0328bb54d209d82dc8a2f391617b47d7a", // metropolis, 1927
    "tt0051744": "9f86563ce2ed86bbfedd5d3e9f4e55aedd660960", // house on haunted hill 1959
    // "tt1254207": // big buck bunny, HTTP stream
};

var addon = new Stremio.Server({
    "stream.get": function(args, callback, user) {
        if (! args.query) return callback();
        return callback(null, dataset[args.query.imdb_id] ? {
            infoHash: dataset[args.query.imdb_id],
            availability: 2, // 0-3 integer representing stream availability, 0 being unavailable, 1 being barely streamable, 2 OK, 3 - in great health
            //mapIdx: 0,
            //map: torrent.files,
            //pieceLength: torrent.pieceLength,
        } : null);
    },
    "stream.find": function(args, callback, user) {
        callback(null, args.items.map(function(x) { return { availability: dataset[x.query.imdb_id] } }));
    }
}, { secret: mySecret }, manifest);

var server = require("http").createServer(function (req, res) {
    addon.middleware(req, res, function() { res.end() }); // wire the middleware - also compatible with connect / express
}).on("listening", function()
{
    console.log("Sample Stremio Addon listening on "+server.address().port);
}).listen(process.env.PORT || 7000);
```


#### You can see a real-world example of a Stremio Add-on here: https://github.com/Ivshti/multipass-torrent/blob/master/stremio-addon/addon.js
