## Meta Get

This is used when double-clicking on items, when opening their detail page. The ``full`` projection returns properties like ``episodes`` and ``uploads``, so this will be especially useful to show ``series`` and ``channel`` types. 

```
var addon = new Stremio.Server({
	"meta.get": function(args, callback, user) {
		// expects one meta element (requested by ID)
	}
});
```

### Request

_otherwise known as `args` in the above code_

```
{
  query: {
    basic_id: 'opa2135'
  }
}
```

See [Meta Request](meta.request.md) for Parameters.

### Response

```
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
}
```

See [Meta Element](meta.element.md) for Parameters.
