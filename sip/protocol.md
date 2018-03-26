# Add-on SDK

## Stremio Add-on Protocol

The Stremio addon protocol defines a universal interface to describe multimedia content. It can describe catalogs, detailed metadata and streams related to multimedia content.

It is typically transported over HTTP or IPFS, and follows a paradigm similar to REST.

This allows Stremio or other similar applications to aggregate content seamlessly from different sources, for example YouTube, Twitch, iTunes, Netflix, DTube and others. It also allows developers to build such add-ons with minimal skill.

To define a minimal add-on, you only need an HTTP server/endpoint serving a `manifest.json` file and responding to resource requests at `/{resource}/{type}/{id}.json`.

**If you're creating an add-on, we recommend you build it using our [addon-sdk](), which will provide a convenient abstraction to the protocol, as well a an easy way of publishing your add-ons.**

Currently used resources are: `catalog`, `meta`, `stream`.

`/catalog/{type}/{id}.json` - catalogs of media items; `type` denotes the type, such as `movie`, `series`, `tv`, and `id` denotes the catalog ID, which is custom and specified in your manifest

`/meta/{type}/{id}.json` - detailed metadata about a particular item; `type` again denotes the type, and `id` is the ID of the particular item, as found in the catalog

`/stream/{type}/{id}.json` - list of all streams for a particular items; `type` again denotes the type, and `id` is the ID of the particular item, as found in the catalog or a video ID (a single metadata object may contain mutiple videos, for example a YouTube channel or a TV series)

The JSON format of the response to these resources is described [here]().

**NOTE: Your add-on may selectively provide any combination of those resources. It must provide at least 1 resource and a manifest.**


## Minimal example

Create a directory called `example-addon`

`manifest.json`:

```
{
    "id": "org.myexampleaddon",
    "version": "1.0.0",
    "name": "simple Big Buck Bunny example",
    "types": [ "movie" ],
    "catalogs": [ "movie/top" ],
    "resources": [ "catalog", "stream" ],
    "idPrefix": "myexampleaddon"
}
```

`/catalogs/movie/top.json`:

```
[{
	"id": "myexampleaddon:1",
	"type": "movie",
	"name": "Big Buck Bunny",
	"poster": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/220px-Big_buck_bunny_poster_big.jpg"
}]
```

`/stream/movie/tt1254207.json`:

```
[{
	"url": "http://distribution.bbb3d.renderfarming.net/video/mp4/bbb_sunflower_1080p_30fps_normal.mp4"
}]
```

This add-on is so simple that it can actually be hosted statically on GitHub pages! 

[See example here: TODO]()


## Next steps

To create an actual add-on, you'd probably need more than a directory of static files.

Check out the following tutorials for different languages:

**If in doubt, and you know JavaScript, use the Node.js SDK**

* [Creating an add-on with the NodeJS Stremio add-on SDK]()
* [Creating an add-on with Python]()
* [Creating an add-on with PHP]()
* [Creating an add-on with NodeJS and express]()

