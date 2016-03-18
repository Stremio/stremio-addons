# Stremio V1 protocol 


## Manifest format

The first thing to define for your add-on is the manifest, which describes it's name, purpose and some technical details.

Valid properties are:

``id`` - **required** - identifier, dot-separated, e.g. "com.stremio.filmon"

``name`` - **required** - human readable name

``description`` - **required** - human readable description

``webDescription`` - _optional_ - human readable description for the auto-generated add-on HTML page ; HTML allowed

``endpoint`` - _optional_ - http endpoint to the hosted version of this add-on; should end in standard stremio URL path, such as ``/stremio/v1`` for the v1 version of the protocol; example: ``http://cinemeta.strem.io/stremioget/stremio/v1``

``background`` - _optional_ - background image for the add-on; URL to png/jpg, at least 1024x786 resolution

``logo`` - _optional_ - logo icon, URL to png, monochrome, 256x256

``types`` - **required** - array of supported types, from all the [``Content Types``](/documentation/protocol.md#content-types)

``isFree`` - _optional_ - set this to ``true`` if you want to specify that all of the content in this add-on is free of charge

``contactEmail`` - **required** - contact email for add-on issues; used for the Report button in the app; also, the Stremio team may reach you on this email for anything relating your add-on

``filter`` - _optional_ - object of conditions for query properties that, when matched, increase the priority of the add-on in the call order

```javascript
 "filter": {
   "query.imdb_id": { "$exists": true },
   "projection.imdb_id": { "$exists": true }
  }
// this wil prioritize our add-on for calls with arguments like { query: { imdb_id: ... }  }
```

``sorts`` - _optional_ - additional types of sorting in catalogues; array of sort objects

```javascript
[
  { prop: "popularities.moviedb", name: "SORT_TRENDING", types: ["movie", "series"] }
]
```

***Tip* - use different sorts to provide different catalogues for your users, e.g. separate "popular movies" and "new movies"**

``searchDebounce`` - _optional_ - how much to de-bounce after the user types before calling ``meta.search``; not all clients use this

``countrySpecific`` - _optional_ - boolean - if true, the stremio client must pass ``countryCode`` of the user along with ``stream.find`` and ``meta.find``. *Example*: add-on for service where the streams are georestricted, e.g. Netflix

``zipSpecific`` - _optional_ - boolean - if true, the stremio client must pass ``zip`` of the user along with ``stream.find`` and ``meta.find``. *Example*: cinema showtimes guide add-on


## All Methods

In your add-on, you can implement the following hooks/methods:

* ``stream.find``
* ``meta.find``
* ``meta.get``
* ``subtitles.get``
* ``stats.get`` 

**To show a catalogue in Discover, you must implement ``meta.find``.**

**To show detailed information about your content (detail page), you must implement ``meta.get``.**

**To implement video streaming for your content, you must implement ``stream.find``.**


## Content types

**Stremio supports the following content types as of Dec 2015:**

* ``movie`` - movie type - has metadata like name, genre, description, director, actors, images, etc. 
* ``series`` - series type - has all the metadata a movie has, plus an array of episodes
* ``channel`` - chnanel type - created to cover YouTube channels; has name, description and an array of uploaded videos
* ``tv`` - tv type - has name, description, genre; streams for ``tv`` should be endless



## Method: ``stream.find``
First thing to keep in mind here is that Stremio supports video streaming through HTTP, BitTorrent and IPFS. 

If you are interested in other protocols, contact us at [office@strem.io](mailto:office@strem.io).

### Request format
``query`` - an object containing an ID property with a value to match, plus extra identifying properties.

**The ID property is the first part of your metadata's `universal identifier`**, for example if your metadata ID is ``"yt_id:UCrDkAvwZum-UTjHmzDI2iIw"`` then the query object to `stream.find` is `{ yt_id: "UCrDkAvwZum-UTjHmzDI2iIw" }`.

This is done to allow using properties to help decide which add-on to be called.

Additional properties in ``query`` are used for content that has multipe videos, for example ``series`` or ``channel``.

``query.season`` - _optional_ - the season number, required for ``series`` type

``query.episode`` - _optional_ - the episode number, required for ``series`` type

``query.video_id`` - _optional_ - the video ID, required for ``channel`` type

``prev`` - _optional_ - the previous [``Stream object's``](/documentation/protocol.md#stream-object) ID that the player played; will be ``undefined`` if there isn't any

**Examples**
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


### Response format

Returns an array of [``stream objects``](/documentation/protocol.md#stream-object). Usually either from different sources (e.g. Netflix, Hulu, iTunes) or in different qualities (``480p``, ``720p``, ``1080p``).


#### Stream object

**One of the following must be passed** to point to the stream itself

* ``url`` - direct URL to a video stream - http, https, rtmp protocols supported
* ``externalUrl`` - URL to the video, which should be opened in a browser (webpage), e.g. link to Netflix
* ``yt_id`` - youtube video ID, plays using the built-in YouTube player
* ``infoHash`` and/or ``mapIdx`` - info hash of a torrent file, and mapIdx is the index of the video file within the torrent; **if mapIdx is not specified, the largest file in the torrent will be selected**

**Additional properties to provide information / behaviour flags**

``name`` - _optional_ - name of the source, e.g. "Netflix"

``availability`` - _optional_ - 0-3 integer representing stream availability, in the context of P2P streams - 0 not available, 1 barely available, 2 OK, 3 highly available

``tag`` - _optional_ - array, optional tags of the stream; use ``"480p"``, ``"720p"``, ``"1080p"``/``"hd"`` or ``"2160p"`` to specify quality

``subtitles`` - _optional_ - [``Subtitles Objects``](/documentation/protocol.md#subtitles-object) representing subtitles for this stream

``repeat`` - _optional_ - boolean, true if you want stremio to do ``stream.find`` again with the same arguments when the video ends, and play again

``live`` - _optional_ - boolean, specify if this is a live stream; this will be auto-detected if you're using HLS

``geos`` - _optional_ - use if the stream is geo-restricted - array of ISO 3166-1 alpha-2 country codes in which the stream is accessible

``isFree`` - _optional_ - set this to ``true`` if the stream si free of charge

``isSubscription`` - _optional_ - set this to ``true`` if this stream requires a subscription (e.g. Netflix)

``isPeered`` - _optional_ - set this to ``true`` if this stream is peered locally and therefore delivered with a high speed; useful for areas with slow internet connections, such as India

``widgetSidebar`` - _optional_ - URL to a page that will be shown in the Player sidebar instead of usual contents; the page will be rendered in a restricted web view, appending "?item_hash=" at the end with Item Hash

``widgetPostPlay`` - _optional_ - URL to a page that will be shown after the playback ends; the page will be rendered in a restricted web view, appending "?item_hash=" at the end with Item Hash

``widgetPrePlay`` - _optional_ - URL to a page that will be shown before the playback begins, instead of the loading page; the page will be rendered in a restricted web view, appending "?item_hash=" at the end with Item Hash



_**Tip**: to provide several streams with varying qualities, return an array of [``Stream Objects``](/documentation/protocol.md#stream-object) with different quality tag in their tag array._

**Example**
```javascript
// Result from stremio.stream.find({ query: { imdb_id: "tt0032138" } })
[{ 
  infoHash: "24c8802e2624e17d46cd555f364debd949f2c81e",
  mapIdx: 0, // optional, the file ID - The.Wizard.of.Oz.1939.1080p.BrRip.x264.BOKUTOX.YIFY.mp4 
  tag: ["mp4", "hd", "1080p", "yifi"],
  availability: 2, // good to calculate that based on seeders if we have them - 0 seeders - 0 avail, 0-20 - 1, 20-50 - 2, 50 - ... - 3 
}]
// This would start streaming wizard of oz in HD in Stremio
```

#### Subtitles object

``id`` - **required** - identifier of the subtitles object - could be any string - serves to identify the set of subtitles for a specific video; example of this is the OpenSubtitles MovieHash - if taking subtitles from there, the MovieHash can be used as an ``id``

``itemHash`` - _optional_  - metadata item hash, which is defined as a combination of the [``Metadata object``](/documentation/protocol.md#metadata-object)'s ``id`` followed by ``season`` / ``episode`` or ``video_id``, separated by a white space; example of this is ``tt0898266 9 17``

``all`` - **required** - all of the subtitle variants for this ``id`` - array of 
```javascript
{ id: "string identifier", url: "url to srt file", lang: "language code in ISO 639-1" }
```


------------------------


## Metadata (``meta.find``, ``meta.get``, ``meta.search``)

Stremio's metadata model is designed to support movies, series and video channels (like YouTube channels). All metadata-related modules must return compatible data.

### Request format

### ``Meta Request``

``query`` - MongoDB-like query object, where all objects must be matched against; should support ``$in``, ``$exists``, ``$gt``, ``$lt`` operators; on ``meta.search`` method, this is a string

``projection`` - MongoDB-like projection object, also accepts string values - ``lean``, ``medium`` and ``full``; lean contains name, year, release date, cast, director; medium also includes episodes (if applicable) and the full projection also includes all images and full cast info

``complete`` - only return items with complete (+images) metadata

``limit`` - limit to N results

``skip`` - skip first N results

_**TIP**: If you don't use MongoDB, you can use [sift](https://www.npmjs.com/package/sift) or [linvodb3](https://www.npmjs.com/package/linvodb3) to support to the query format._


### Response format

The response is an array of Metadata objects. 

#### Metadata object

``id`` - **required** - universal identifier, formed like "DOMAIN_id:ID", for example "yt_id:UCrDkAvwZum-UTjHmzDI2iIw".

``type`` - **required** - type of the content; e.g. `movie`, `series`, `channel`, `tv`

``name`` - **required** - name of the content

``genre`` - **required**  - genre/categories of the content; array of strings, e.g. ``["Thriller", "Horror"]``

``poster`` - **required** - URL to png of poster; accepted aspect ratios: 1:0.675 (IMDb poster type) or 1:1 (square) ; you can use any resolution, as long as the file size is below 100kb; below 50kb is recommended

``posterShape`` - _optional_ - can be `square` (1:1 aspect) or `regular` (1:0.675). If you don't pass this, `regular` is assumed

``background`` - _optional_ - the background shown on the stremio detail page ; heavily encouraged if you want your content to look good; URL to PNG, max file size 500kb

``description`` - _optional_ - a few sentances describing your content

``year`` - _optional_ - string - year the content came out ; if it's ``series`` or ``channel``, use a start and end years split by a tide - e.g. ``"2000-2014"``. If it's still running, use a format like ``"2000-"``

``director``, ``cast`` - _optional_  - directors and cast, both arrays of names

``imdbRating`` -  _optional_ - IMDb rating, a number from 0 to 10 ; use if applicable

``dvdRelease`` - _optional_ - DVD release date

``episodes`` - _optional_ - used for ``series``, array of Episode objects

``uploads`` - _optional_ - used for ``channel``, array of Video objects

``certification`` - _optional_ - [MPAA rating](http://www.mpaa.org/film-ratings/) - can be "G", "PG", "PG-13", "R", "NC-17"

``runtime`` - _optional_ - human-readable expected runtime - e.g. "120m"

``language`` - _optional_ - spoken language

``country`` - _optional_ - official country of origin

``awards`` - _optional_ - human-readable string that describes all the significant awards

``website`` - _optional_ - URL to official website

``isPeered`` - _optional_ - set this property if you know whether that item can be streamed with peering by the same add-on which is serving the meta



#### Episode object
``number`` - **required** - number of the episode

``season`` - **required** - season number of the episode

``name`` - **required** - name of the episode

``firstAired`` - **required** - Date, air date of the episode

``trailer`` - _optional_ - YouTube ID of the trailer video for the episode

``overview`` - _optional_ - episode overview/summary

#### Video object

``title`` - **required** - title of the video

``publishedAt`` - **required** - Date, publish date of the video

``id`` - **required** - YouTube ID of the video

``thumbnail`` - **required** - URL to png of the video thumbnail, in the video's aspect ratio, max file size 5kb

### Methods

#### meta.find
Takes [``Meta Request``](/documentation/protocol.md#meta-request), as described, returns the first matched result in ``full`` projection unless specified otherwise. 

This is used for loading full catalogue in Discover.

#### meta.get
Takes [``Meta Request``](/documentation/protocol.md#meta-request), as described, returns an array of matched results in ``lean`` projection unless specified otherwise.

This is used when double-clicking on items, when opening their detail page. The ``full`` projection returns properties like ``episodes`` and ``uploads``, so this will be especially useful to show ``series`` and ``channel`` types. 

#### meta.search
Perform a text search. Arguments are exactly the same as usual [``Meta Request``](/documentation/protocol.md#meta-request), except ``query`` is a string. Returns an array of [``Metadata Object``](/documentation/protocol.md#metadata-object) matches.

This is used for the Search functionality.

## Subtitles (``subtitles.find``)

### Request format

### ``Subtitles Request``

``query`` - **required** - Object, query to retrieve the subtitles

``query.itemHash`` - **required** - identifies the current item based on metadata

For movies, this is only the IMDB ID, e.g. ``"tt0063350"``.

For series, this is the IMDB, and season/episode numbers, split with interval - e.g. ``"tt1748166 1 1"`` for season 1, episode 1 of [_Pioneer One_](https://en.wikipedia.org/wiki/Pioneer_One)

For channels, this is the YouTube ID of the channel and the YouTube ID of the video, split with an interval. For example, ``"UC3gsgELlsob7AFi-mHOqNkg 9bZkp7q19f0"``.

``query.videoHash`` - _optional_ - String -highly recommended to use - this is the hash of the video, generated with the [_OpenSubtitles algorithm_](https://trac.opensubtitles.org/projects/opensubtitles/wiki/HashSourceCodes)

``query.videoSize`` - _optional_ - Number - byte size of the video

``query.videoName`` - _optional_ - filename of the original video

``supportsZip`` - _optional_ - boolean, true if your client supports ``.zip`` files for subtitles; in this case, the client should use the first ``.srt`` file inside the provided ``.zip`` file
