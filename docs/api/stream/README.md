### Stream Link

Stream links are being handled by the `stream.find` method.

First thing to keep in mind here is that Stremio supports video streaming through HTTP, BitTorrent and IPFS. 

If you are interested in other protocols, contact us at [office@strem.io](mailto:office@strem.io).

```javascript
var addon = new Stremio.Server({
	"stream.find": function(args, callback, user) {
		// expects an array of stream links
	}
});
```

#### Request Examples

```javascript
{
  query: {
    basic_id: "opa2135"
  }
}
```
```javascript
// Request The Wizard of Oz
{
  query: {
    imdb_id: "tt0032138"
  }
}
```
```javascript
// Request pilot of Game of Thrones
{
  query: {
    imdb_id: "tt0944947",
    season: 1,
    episode: 1
  }
}
```
```javascript
// Request Gangnam Style
{
  query: {
    yt_id: "UCrDkAvwZum-UTjHmzDI2iIw",
    video_id: "9bZkp7q19f0"
  }
}
```



#### Response

_Example of a response with a link to a media file:_

```javascript
[
  {
    basic_id: 'opa2135',         // what you set as "id" in the "meta.get" response
    availability: 1,             // should be at least "1" if the stream works
    isFree: 1,                   // can also be "0" if it's not free
    url: 'http://goo.gl/nM2J1x', // any streamable url
    title: 'HD',                 // set quality here as string
    tag: ['hls']
  }
]
```

_Example of a response for a torrent:_

```javascript
// Result from stremio.stream.find({ query: { imdb_id: "tt0032138" } })
[
  { 
    infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e", // info hash of torrent
    mapIdx: 0,                                            // optional, the file number (position) in the torrent
    tag: ["mp4", "hd", "1080p", "yifi"],
    availability: 2,                                      // good to calculate this based on seeders, if we have them
                                                          // 0 seeders -> 0 avail; 0-20 -> 1; 20-50 -> 2; 50+ -> 3; ...
  }
]
// This would start streaming wizard of oz in HD in Stremio
```

See [Stream Response](stream.response.md) for Parameters.
