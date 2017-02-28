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
  id: 'basic_id:opa2135',         // unique ID for the media, will be returned as "basic_id" in the request object later
  name: 'basic title',            // title of media
  poster: 'http://goo.gl/rtxs10', // image link
  posterShape: 'regular',         // can also be 'landscape' or 'square'
  banner: 'http://goo.gl/xgCrG9', // image link
  genre: ['Entertainment'],
  isFree: 1,                      // some aren't
  popularity: 3831,               // the larger the better
  popularities: { basic: 3831 },  // same as 'popularity'
  type: 'movie'                   // can also be "tv", "series", "channel"
}
```

See [Meta Element](meta.element.md) for Parameters.

See [Content Types](content.types.md) for the `type` parameter.
