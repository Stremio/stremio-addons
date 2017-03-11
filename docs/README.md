### Getting started

You can scaffold an empty Stremio add-on by running:

```
npm install -g yeoman
yo stremio
```

You will find generated Stremio addon source code in `output/` directory.


### Anatomy of an Add-on

```javascript
var Stremio = require("stremio-addons");

var manifest = { 
    // Basic properties
    "id": "org.stremio.basic", // just change "basic" to a shorthand of your add-on
    "version": "1.0.0",

    // Properties that determine when Stremio picks this add-on
    "types": ["movie"], // can also be "tv", "series", "channel"; your add-on will be preferred for those content types
    "idProperty": "imdb_id", // the property to use as an ID for your add-on; your add-on will be preferred for items with that property; can be an array

    // Properties that determine how the add-on looks
    "name": "Example Addon",
    "description": "Sample addon providing a few public domain movies",
    "icon": "URL to 256x256 monochrome png icon", 
    "background": "URL to 1366x756 png background",
};

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
    "meta.genres": function(args, callback, user) {
        // callback expects array of strings (genres)
    },
}, manifest);

var server = require("http").createServer(function (req, res) {
    addon.middleware(req, res, function() { res.end() }); // wire the middleware - also compatible with connect / express
}).on("listening", function()
{
    console.log("Sample Stremio Addon listening on "+server.address().port);
}).listen(process.env.PORT || 7000); // set port for add-on

```

### Documentation

- [Benefits - why should I create an add-on?](/docs/BENEFITS.md)

- [Manifest](/docs/api/manifest.md)
- [Meta Feed](/docs/api/meta/meta.find.md)
- [Searching](/docs/api/meta/meta.search.md)
- [Meta Element](/docs/api/meta/meta.element.md)
- [Stream Link](/docs/api/stream/README.md)
- [Subtitles](/docs/api/subtitles/README.md)

### Tutorials

- [Scaffolding an Add-on](/docs/tutorial/scaffolding.md)
- [Creating an Add-on](https://github.com/Stremio/addon-helloworld)
- [Hosting your Add-on](/docs/tutorial/hosting.md)
- [Publishing an Add-on](/docs/tutorial/publishing.md)
- [Testing Environments](/docs/tutorial/testing.md)
- [Using Cinemeta (meta API)](/docs/tutorial/using-cinemeta.md)
- [Using add-ons client in browser](/docs/tutorial/using-in-browser.md)
- [Add to Your App](/docs/tutorial/add.to.app.md)
- [Hosting multiple add-ons](https://github.com/Stremio/stremio-addons-box)

