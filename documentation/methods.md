# Streaming
First thing to keep in mind here is that Stremio supports video streaming through HTTP or BitTorrent-compatible descriptors. If you are interested in other protocols, contact us at [office@strem.io](mailto:office@strem.io).

## stream.get

## stream.find

**Stream model - required properties**
```javascript
{
	infoHash: "infohash of torrent",
	mapIdx: "index of the file within the torrent to stream from",
	tag: [], // tags of the stream, 
	availability: 2 // 0-3 integer representing stream availability, 0 being unavailable, 1 being barely streamable, 2 OK, 3 - in great health
}
```


# Metadata
Stremio's metadata model is designed to support movies, series and video channels (like YouTube channels). All metadata-related modules must return compatible data.

## meta.get

## meta.find

## meta.search


**Metadata model - required properties**
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
