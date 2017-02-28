## Meta Genres

This is used when loading the Discover page, in order to show all genres in the left sidebar. 

**NOTE:** If you do not implement this call (not recommended), the genres will be gathered from all items you return in the first `meta.find` call.

```javascript
var addon = new Stremio.Server({
	"meta.genres": function(args, callback, user) {
		// callback expects an object with genres array
	}
});
```

### Request

_otherwise known as `args` in the above code_

```javascript
{
  query: { 
    type: "movies" // the type for which to return genres
  },
  sort: {
    'popularities.basic': -1 // -1 for descending, 1 for ascending
  },
}
```

### Response

```javascript
{
  genres: [
    // simple array of strings for the genres
    "Action",
    "Lifestyle",
  ]
}
```

See [Content Types](content.types.md) for the `type` parameter.
