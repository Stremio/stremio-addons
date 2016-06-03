### Stream Link

Stream links are being handled by the `stream.find` method.

First thing to keep in mind here is that Stremio supports video streaming through HTTP, BitTorrent and IPFS. 

If you are interested in other protocols, contact us at [office@strem.io](mailto:office@strem.io).

```
var addon = new Stremio.Server({
	"stream.find": function(args, callback, user) {
		// expects an array of stream links
	}
});
```

#### Request

```javascript
{ query: { basic_id: "opa2135" } }
```
```javascript
// Request The Wizard of Oz
{ query: { imdb_id: "tt0032138" } }
```
```javascript
// Request pilot of Game of Thrones
{ query: { imdb_id: "tt0944947", season: 1, episode: 1 } }
```
```javascript
// Request Gangnam Style
{ query: { yt_id: "UCrDkAvwZum-UTjHmzDI2iIw", video_id: "9bZkp7q19f0" } }
```



#### Response

_Example of a response with a link to a media file:_

```javascript
[
  {
    basic_id: 'opa2135',
    availability: 1,
    isFree: 1,
    url: 'http://archive.org/download/CartoonClassics/Krazy_Kat_-_Keeping_Up_With_Krazy.mp4',
    title: 'HD',
    tag: ['hls']
  }
]
```

_Example of a response for a torrent:_

```javascript
// Result from stremio.stream.find({ query: { imdb_id: "tt0032138" } })
[
  { 
    infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e",
    mapIdx: 0, // optional, the file ID - The.Wizard.of.Oz.1939.1080p.BrRip.x264.BOKUTOX.YIFY.mp4 
    tag: ["mp4", "hd", "1080p", "yifi"],
    availability: 2, // good to calculate that based on seeders if we have them - 0 seeders - 0 avail, 0-20 - 1, 20-50 - 2, 50 - ... - 3 
  }
]
// This would start streaming wizard of oz in HD in Stremio
```

See [Stream Response](stream.response.md) for Parameters.
