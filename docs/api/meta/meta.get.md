## Meta Get

This is used when opening an item's detail page (e.g. double click from Discover). The result has to contain properties like ``episodes``, ``uploads`` and ``cast``, so this is especially useful to show ``series`` and ``channel`` types. 

```javascript
var addon = new Stremio.Server({
	"meta.get": function(args, callback, user) {
		// expects one meta element (requested by ID)
	}
});
```

### Request

_otherwise known as `args` in the above code_

```javascript
{
  query: {
    basic_id: 'opa2135' // based on what you set as "id" in the previous responses
  }
}
```

See [Meta Request](meta.request.md) for Parameters.

### Response

```javascript
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
}
```

See [Meta Element](meta.element.md) for Parameters.

See [Content Types](content.types.md) for the `type` parameter.
