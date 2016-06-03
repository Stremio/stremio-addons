## Meta Search

Perform a text search. Arguments are exactly the same as usual [``Meta Request``](meta.request.md), except ``query`` is a string. Returns an array of [``Meta Elements``](metadata.element.md) matches.

This is used for the Search functionality.

Does not support pagination.

```
var addon = new Stremio.Server({
	"meta.search": function(args, callback, user) {
		// expects one meta element (requested by ID)
	}
});
```

### Request

_otherwise known as `args` in the above code_

```
{
  query: 'baseball season',
  limit: 10
}
```

See [Meta Request](meta.request.md) for Parameters.

### Response

```
{
  query: 'baseball season'
  results: [
    {
      id: 'basic_id:opa2135',
      name: 'basic title',
      poster: 'http://goo.gl/rtxs10', // image link
      posterShape: 'regular', // can also be 'landscape' or 'square'
      banner: 'http://goo.gl/xgCrG9', // image link
      genre: ['Entertainment'],
      isFree: 1, // some aren't
      popularity: 3831, // the larger the better
      popularities: { basic: 3831 }, // same as 'popularity'
      type: 'movie'
    },
	...
  ],
}
```

See [Meta Element](meta.element.md) for Parameters.
