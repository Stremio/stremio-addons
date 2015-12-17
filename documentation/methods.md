#### Warning: this is work in progress.



## All Methods

In your add-on, you can implement the following hooks/methods:

* ``stream.find``
* ``meta.find``
* ``meta.get``
* ``subtitles.get``
* ``stats.get`` 

To show a catalogue in Discover, you **must** implement ``meta.find``.

To show detailed information about your content (detail page), you **must** implement ``meta.get``.

To implement video streaming for your content, you **must** implement ``stream.find``.



## Content types

**Stremio supports the following content types as of Dec 2015:**

* ``movie`` - movie type - has metadata like name, genre, description, director, actors, images, etc. 
* ``series`` - series type - has all the metadata a movie has, plus an array of episodes
* ``channel`` - chnanel type - created to cover YouTube channels; has name, description and an array of uploaded videos
* ``tv`` - tv type - has name, description, genre; streams for ``tv`` should be endless



## Method: ``stream.find``
First thing to keep in mind here is that Stremio supports video streaming through HTTP or BitTorrent-compatible descriptors. If you are interested in other protocols, contact us at [office@strem.io](mailto:office@strem.io).

#### Request format
``query`` - an object containing ``imdb_id`` or ``yt_id`` (strings), and also ``season``, ``episode`` (numbers) if applicable

**Example**
```javascript
{ query: { imdb_id: "tt0032138" } }
```

#### Response format

Return an array of stream objects.

##### Stream object

``availability`` - **required** - 0-3 integer representing stream availability - 0 not available, 1 barely available, 2 OK, 3 highly available

``tag`` - _optional_ - array, optional tags of the stream; use ``"480p"``, ``"720p"``, ``"1080p"``/``"hd"`` or ``"2160p"`` to specify quality

Additionally, **one of the following must be passed** to point to the stream itself

* ``url`` - direct URL to a video stream - http, https, rtmp protocols supported
* ``externalUrl`` - URL to the video, which should be opened in a browser (webpage), e.g. link to Netflix
* ``yt_id`` - youtube video ID, plays using the built-in YouTube player
* ``infoHash`` and ``mapIdx`` - info hash of a torrent file, and mapIdx is the index of the video file within the torrent; **if mapIdx is not specified, the largest file in the torrent will be selected**

_**Tip**: to provide several streams with varying qualities, return an array of Stream Objects with different quality tag in their tag array._

##### Example
```javascript
// Result from stremio.stream.find({ query: { imdb_id: "tt0032138" } })
[{ 
  infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e",
  mapIdx: 0, // The.Wizard.of.Oz.1939.1080p.BrRip.x264.BOKUTOX.YIFY.mp4 
  tag: ["mp4", "hd", "1080p", "yifi"],
  availability: 2, // good to calculate that based on seeders if we have them - 0 seeders - 0 avail, 0-20 - 1, 20-50 - 2, 50 - ... - 3 
}]
// This would start streaming wizard of oz in HD in Stremio
```

------------------------


## Metadata
Stremio's metadata model is designed to support movies, series and video channels (like YouTube channels). All metadata-related modules must return compatible data.

#### Request format: 

#### ``Meta Request``

``query`` - MongoDB-like query object, where all objects must be matched against; should support ``$in``, ``$exists``, ``$gt``, ``$lt`` operators; on ``meta.search`` method, this is a string

``projection`` - MongoDB-like projection object, also accepts string values - ``lean``, ``medium`` and ``full``; lean contains name, year, release date, cast, director; medium also includes episodes (if applicable) and the full projection also includes all images and full cast info

``complete`` - only return items with complete (+images) metadata

``limit`` - limit to N results

``skip`` - skip first N results

_**TIP**: If you don't use MongoDB, you can use [sift](https://www.npmjs.com/package/sift) or [linvodb3](https://www.npmjs.com/package/linvodb3) to support to the query format._


#### Response format

The response is an array of Metadata objects. 

##### Metadata object

``id`` - **required** - universal identifier, formed like "DOMAIN_id:ID", for example "yt_id:UCrDkAvwZum-UTjHmzDI2iIw".

``type`` - **required** - type of the content; e.g. `movie`, `series`, `channel`, `tv`

``name`` - **required** - name of the content

``genre`` - **required**  - genre/categories of the content; array of strings, e.g. ``["Thriller", "Horror"]``

``poster`` - **required** - URL to png of poster; accepted aspect ratios: 1:0.675 (IMDb poster type) or 1:1 (square) ; you can use any resolution, as long as the file size is below 100kb; below 50kb is recommended

``posterShape`` - _optional_ - can be `square` (1:1 aspect) or `regular` (1:0.675). If you don't pass this, `regular` is assumed

``banner`` - _optional_ - the background shown on the stremio detail page ; heavily encouraged if you want your content to look good; URL to PNG, max file size 500kb

``description`` - _optional_ - a few sentances describing your content

``year`` - _optional_ - string - year the content came out ; if it's ``series`` or ``channel``, use a start and end years split by a tide - e.g. ``"2000-2014"``. If it's still running, use a format like ``"2000-"``

``director``, ``cast`` - _optional_  - directors and cast, both arrays of names

``imdbRating`` -  _optional_ - IMDb rating, a number from 0 to 10 ; use if applicable


#### meta.get
Takes ``Meta Request``, as described, returns an array of matched results in ``lean`` projection unless specified otherwise.

#### meta.find
Takes ``Meta Request``, as described, returns the first matched result in ``full`` projection unless specified otherwise.

#### meta.search
Perform a text search. Arguments are exactly the same as usual ``Meta Request``, except ``query`` is a string. Returns an array of matches.

