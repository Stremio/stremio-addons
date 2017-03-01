## Meta Find

The meta feed is being handled by the `meta.find` method. This is used for loading full catalogue in Discover (Stremio).

```javascript
var addon = new Stremio.Server({
	"meta.find": function(args, callback, user) {
		// expects array of meta elements (primary meta feed)
		// it passes "limit" and "skip" for pagination
	}
});
```

### Request

_otherwise known as `args` in the above code_

```javascript
{
  query: {
    type: 'movie',                     // can also be "tv", "series", "channel"
    'popularities.basic': { '$gt': 0 }
  },
  popular: true,
  complete: true,
  sort: {
    'popularities.basic': -1 // -1 for descending, 1 for ascending
  },
  limit: 70,                           // limit length of the response array to "70"
  skip: 0                              // offset, as pages change it will progress to "70", "140", ...
}
```

When an array of fewer then `70` elements is returned, the feed will be considered finished and pagination will no longer be requested.

See [Meta Request](meta.request.md) for Parameters.

See [Content Types](content.types.md) for the `type` parameter.

### Response

```javascript
[
  {
    id: 'basic_id:opa2135',                                       // unique ID for the media, will be returned as "basic_id" in the request object later
    name: 'basic title',                                          // title of media
    poster: 'http://thetvdb.com/banners/posters/78804-52.jpg',    // image link
    posterShape: 'regular',                                       // can also be 'landscape' or 'square'
    banner: 'http://thetvdb.com/banners/graphical/78804-g44.jpg', // image link
    genre: ['Entertainment'],
    isFree: 1,                                                    // some aren't
    popularity: 3831,                                             // the larger, the more popular this item is
    popularities: { basic: 3831 },                                // same as 'popularity'; use this if you want to provide different sort orders in your manifest
    type: 'movie'                                                 // can also be "tv", "series", "channel"
  },
  ...
]
```

See [Meta Element](meta.element.md) for Parameters.

See [Content Types](content.types.md) for the `type` parameter.

SEe [Manifest](/docs/api/manifest.md) for instructions on how to define custom sort orders (Discover Tabs)
