What are Stremio Add-ons
==================================

A Stremio Addon, unlike similar concepts (plugins for XBMC or channels for Plex) communicates with Stremio **through HTTP and is hosted by the Add-on provider**, instead of running inside the app itself.
The reasons for this are:
* Easy way for the user to enable the Add-on, just by activating an Addon at a given URL
* Security, no extra code running inside Stremio
* Simpler overall architecture - if the data you're providing to Stremio lies on your servers, the Add-on server can reach it directly and give it to clients

Creating a Stremio Add-on
========================
1. To create a Stremio Add-on, you need to implement the Add-on protocol first - or use a ready solution for Node.js - [stremio-addons](http://github.com/Stremio/stremio-addons).
2. Think of the Add-on details - name, description, version, hints
3. Implement one or more of the following methods: ``stream.get``, ``stream.find``, ``meta.get``, ``meta.find``, ``meta.search`` which Stremio is going to use

Here's a sample Add-on that will provide BitTorrent streams for a few public domain movies:
```javascript
var Stremio = require("stremio-addons");
var stremioCentral = "http://api8.herokuapp.com";
var addon = new Stremio.Server({
	"stream.get": function(args, callback, user) {

	},
  "stream.find": function(args, callback, user) {

  }
}, { allow: [stremioCentral], secret: stremioSecret }, _.extend(require("./stremio-manifest"), _.pick(require("../package"), "version")));

var server = http.createServer(function (req, res) {
    addon.middleware(req, res, function() { res.end() });
}).on("listening", function()
{
	console.log("Sample Stremio Addon listening on "+server.address().port);
}).listen(process.env.PORT || 7000);

// addon.middleware is connect/express-compatible, you can also use it with express
```

Here's a sample Add-on that will provide HTTP streams for Big Buck Bunny:
```

```

You can see a real-world example of a Stremio Add-on here: https://github.com/Ivshti/multipass-torrent/blob/master/stremio-addon/addon.js
