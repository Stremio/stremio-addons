
# Using Cinemeta
**Cinemeta** is the first offical Stremio Add-on - it provides metadata for most movies / TV series in IMDB.

It can be seen as an alternative of APIs like OMDb, TheMovieDB and TheTVDB.

It also provides an indexing mechanism (through ``index.get``) method that automatically identifies an IMDB ID from a filename.

Retrieving metadata and associating video files with IMDB ID are useful use cases both for Stremio itself, and for building new Add-ons. 

# Initializing a client
```javascript
var CINEMETA_ENDPOINT = "http://cinemeta.strem.io/stremioget";

var Stremio = require("stremio-addons");
var addons = new Stremio.Client();
addons.add(CINEMETA_ENDPOINT);
addons.setAuth("http://api9.strem.io", "8417fe936f0374fbd16a699668e8f3c4aa405d9f"); // default stremio server, testing secret
```

# Using ``meta.*`` methods
```javascript
// get all the detailed data on a movie/series
addons.meta.get({ query: { imdb_id: "tt0032138" } }, function(err, meta) {
	console.log(meta);
});

// get top 50 series
addons.meta.find({ query: { type: "series" }, limit: 50 }, function(err, res) { 
	console.log(res); // array of 50 series
});
```

For documentation on the ``meta.get`` or ``meta.find`` interface, see [Meta Request](https://github.com/Ivshti/stremio-addons/blob/master/documentation/protocol.md#meta-request) and [Meta Response](https://github.com/Ivshti/stremio-addons/blob/master/documentation/protocol.md#response-format-1).

# Using ``index.get``
```javascript

addons.index.get({ files: [ { path: "The.Wizard.of.Oz.1939.1080p.BrRip.x264.BOKUTOX.YIFY.mp4" } ] }, function(err, res) { 
	console.log(res);
	console.log(res.files[0].imdb_id); // outputs tt0032138
});
```
