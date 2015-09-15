#### Warning: this is work in progress.

# Streaming
First thing to keep in mind here is that Stremio supports video streaming through HTTP or BitTorrent-compatible descriptors. If you are interested in other protocols, contact us at [office@strem.io](mailto:office@strem.io).

#### Request format
``query`` - an object containing ``imdb_id`` or ``yt_id`` (strings), and also ``season``, ``episode`` (numbers) if applicable
**example**
```javascript
{ query: { imdb_id: "tt0032138" } }
```

#### Response format

``availability`` - 0-3 integer representing stream availability - 0 available, 1 barely available, 2 OK, 3 highly available

``tag`` - array, optional tags of the stream; currently "hd" tag recognized

Additionally, one of these have to be passed to point to the stream itself

``infoHash`` and ``mapIdx`` - info hash of a torrent file, and mapIdx is the index of the video file within the torrent

``url`` - direct URL to a video stream - http, https, rtmp protocols supported

``externalUrl`` - URL to the video, which should be opened in a browser (webpage) 

Example
```javascript
{ 
  infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e",
  mapIdx: 0, // The.Wizard.of.Oz.1939.1080p.BrRip.x264.BOKUTOX.YIFY.mp4 
  tag: ["mp4", "hd", "1080p", "yifi"],
  availability: 2, // good to calculate that based on seeders if we have them - 0 seeders - 0 avail, 0-20 - 1, 20-50 - 2, 50 - ... - 3 
}
// This would start streaming wizard of oz in HD in Stremio
```


## stream.get

## stream.find


# Metadata
Stremio's metadata model is designed to support movies, series and video channels (like YouTube channels). All metadata-related modules must return compatible data.

#### Request format: 
``query`` - MongoDB-like query object, where all objects must be matched against; must support ``$in``, ``$exists``, ``$gt``, ``$lt`` operators; on ``meta.search`` method, this is a string

``projection`` - MongoDB-like projection object, also accepts string values - ``lean``, ``medium`` and ``full``; lean contains name, year, release date, cast, director; medium also includes episodes (if applicable) and the full projection also includes all images and full cast info

``complete`` - only return items with complete (+images) metadata

``limit`` - limit to N results

``skip`` - skip first N


#### Response format
```javascript
{
	name: "",
	year: "",
	type: "", // currently accepted types are movie, serries, channel
	imdb_id: "", // or
	yt_id: "",
	description: "...",

}
```

## meta.get
Takes request, as described, returns an array of matched results in ``lean`` projection unless specified otherwise.

## meta.find
Takes request, as described, returns the first matched result in ``full`` projection unless specified otherwise.

## meta.search
Perform a text search. Arguments are exactly the same as the request format, except ``query`` is a string. Returns an array of matches.

