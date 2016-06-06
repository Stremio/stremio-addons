## Meta Search

Perform a text search. Arguments are exactly the same as usual [``Meta Request``](meta.request.md), except ``query`` is a string. Returns an array of [``Meta Elements``](metadata.element.md) matches.

This is used for the Search functionality.

Does not support pagination.

```javascript
var addon = new Stremio.Server({
	"meta.search": function(args, callback, user) {
		// expects one meta element (requested by ID)
	}
});
```

### Request

_otherwise known as `args` in the above code_

```javascript
{
  query: 'baseball season', // search query
  limit: 10                 // limit length of the response array to "10"
}
```

See [Meta Request](meta.request.md) for Parameters.

### Response

```javascript
{
  query: 'baseball season', // return the query from the response
  results: [
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
    },
	...
  ],
}
```

See [Meta Element](meta.element.md) for Parameters.

See [Content Types](content.types.md) for the `type` parameter.