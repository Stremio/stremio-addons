## Using Cinemeta

**Cinemeta** is the first offical Stremio Add-on - it provides metadata for most movies / TV series in IMDB.

It can be seen as an alternative of APIs like OMDb, TheMovieDB and TheTVDB.

It also provides an indexing mechanism (through ``index.get``) method that automatically identifies an IMDB ID from a filename.

Retrieving metadata and associating video files with IMDB ID are useful use cases both for Stremio itself, and for building new Add-ons. 

### Initializing a client

```javascript
var CINEMETA_ENDPOINT = "http://cinemeta.strem.io/stremioget/stremio/v1";

var Stremio = require("stremio-addons");
var addons = new Stremio.Client();
addons.add(CINEMETA_ENDPOINT);
```

### Using ``meta.*`` methods

```javascript
// get all the detailed data on a movie/series
addons.meta.get({ query: { imdb_id: "tt0032138" } }, function(err, meta) {
	console.log(meta);
});

// get top 50 series
addons.meta.find({ query: { type: "series" }, limit: 50 }, function(err, res) { 
	console.log(res); // array of 50 series
});

// TIP: in order to get other content types, you can initialize add-ons for them
// addons.add("http://channels.strem.io/stremioget/stremio/v1");
// addons.add("http://filmon.strem.io/stremioget/stremio/v1");

```

For documentation on the ``meta.get`` or ``meta.find`` interface, see [Meta Request](../meta/meta.request.md) and [Meta Response](../meta/meta.element.md).

### Using ``index.get``

```javascript

addons.index.get({ files: [ { path: "The.Wizard.of.Oz.1939.1080p.BrRip.x264.BOKUTOX.YIFY.mp4" } ] }, function(err, res) { 
	console.log(res);
	console.log(res.files[0].imdb_id); // outputs tt0032138
});
```
