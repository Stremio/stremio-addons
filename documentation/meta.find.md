## Meta Find

The meta feed is being handled by the `meta.find` method. This is used for loading full catalogue in Discover (Stremio).

```
var addon = new Stremio.Server({
	"meta.find": function(args, callback, user) {
		// expects array of meta elements (primary meta feed)
		// it passes "limit" and "skip" for pagination
	}
});
```

### Request

_otherwise known as `args` in the above code_

```
{
  query: {
    type: 'movie',
    'popularities.basic': { '$gt': 0 }
  },
  popular: true,
  complete: true,
  sort: {
    'populstities.basic': -1
  },
  limit: 70,
  skip: 0
}
```

When an array of fewer then `70` elements is returned, the feed will be considered finished and pagination will no longer be requested.

See [Meta Request](meta.request.md) for Parameters.

### Response

```
[
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
]
```

See [Meta Element](meta.element.md) for Parameters.
