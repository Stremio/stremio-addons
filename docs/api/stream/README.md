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
var client = new Stremio.Client()
//client.add('url to my add-on')
client.stream.find({
  query: {
    basic_id: "opa2135"
  }
}, function(err, resp) { 
})
```
```javascript
// Request The Wizard of Oz
client.stream.find({
  query: {
    imdb_id: "tt0032138"
  }
}, function(err, resp) { 
})
```
```javascript
// Request pilot of Game of Thrones
client.stream.find({
  query: {
    imdb_id: "tt0944947",
    season: 1,
    episode: 1
  }
}, function(err, resp) { 
})
```
```javascript
// Request Gangnam Style
client.stream.find({
  query: {
    yt_id: "UCrDkAvwZum-UTjHmzDI2iIw",
    video_id: "9bZkp7q19f0"
  }
}, function(err, resp) { 
})
```

#### Search

The add-on can also implement the `stream.search` method to perform a full text-search through all available streams

The argument is simply an object with  ``query`` property that is a string. Returns an array of [``Stream Object``](stream.response.md) matches.

#### Search Examples

```javascript
var client = new Stremio.Client()
//client.add('url to my add-on')
client.stream.find({
  query: "gangnam style"
}, function(err, resp) { 
})
```



#### Response

_Example of a response with a link to a media file:_

```javascript
[
  {
    basic_id: 'opa2135',         // what you set as "id" in the "meta.get" response
    availability: 1,             // should be at least "1" if the stream works
    isFree: 1,                   // can also be "0" if it's not free
    url: 'http://techslides.com/demos/sample-videos/small.mp4', // any streamable url
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
