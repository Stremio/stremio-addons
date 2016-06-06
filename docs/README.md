### Anatomy of an Add-on

```javascript
var Stremio = require("stremio-addons");

var manifest = { 
    "name": "Example Addon",
    "description": "Sample addon providing a few public domain movies",
    "icon": "URL to 256x256 monochrome png icon", 
    "background": "URL to 1366x756 png background",
    "id": "org.stremio.basic", // just change "basic" to a shorthand of your add-on
    "version": "1.0.0",
    "types": ["movie"], // can also be "tv", "series", "channel",

    // filter: when the client calls all add-ons, the order will depend on how many of those conditions are matched in the call arguments for every add-on
    "filter": { "query.basic_id": { "$exists": true }, "query.type": { "$in":["movie"] } }
};

var addon = new Stremio.Server({
    "stream.find": function(args, callback, user) {
        // expects stream link
    },
	"meta.find": function(args, callback, user) {
		// expects array of meta elements (primary meta feed)
		// it passes "limit" and "skip" for pagination
	},
	"meta.get": function(args, callback, user) {
		// expects one meta element
	},
	"meta.search": function(args, callback, user) {
		// expects array of search results with meta elements
		// does not support pagination
	},
}, { stremioget: true }, manifest);

var server = require("http").createServer(function (req, res) {
    addon.middleware(req, res, function() { res.end() }); // wire the middleware - also compatible with connect / express
}).on("listening", function()
{
    console.log("Sample Stremio Addon listening on "+server.address().port);
}).listen(process.env.PORT || 7000); // set port for add-on
```

### Documentation

- [Manifest](/api/manifest.md)
- [Meta Feed](/api/meta/meta.feed.md)
- [Searching](/api/meta/meta.search.md)
- [Meta Element](/api/meta/meta.element.md)
- [Stream Link](/api/stream/README.md)
- [Subtitles](/api/subtitles/README.md)

### Tutorials

- [Testing Environments](/tutorial/testing.md)
- [Using Cinemeta (meta API)](/tutorial/using-cinemeta.md)
- [Add to Your App](/tutorial/add.to.app.md)
