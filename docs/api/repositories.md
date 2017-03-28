### Repositories

Repositories are JSON files accessed over HTTP/HTTPS that contain information about add-ons.

Repositories are added to the Stremio catalogue, after which it starts displaying all the add-ons in this repository so the user can install them.

This is an example of the official repository: [http://api9.strem.io/addonsrepo.json](http://api9.strem.io/addonsrepo.json)

This is the basic format for a repository: 

`addons` - _optional_ - array of [``add-on meta objects``](/docs/api/repositories.md#add-on-meta-object)

`endpoints` - _optional_ - array of add-on endpoints; use this if you don't know the add-on meta

#### Add-on meta object

`id` - **required** - add-on identifier

`endpoints` - **required** - array of all endpoints (URLs) that this add-on can be accessed on

`name` - **required** - add-on name

`logo` - _optional_ - URL to add-on logo

Example:

```json
{
	"addons": [{
		"id": "com.linvo.cinemeta",
		"endpoints": [
			"https://cinemeta.strem.io/stremioget/stremio/v1"
		],
		"name": "Cinemeta",
	}],
	"endpoints": [
		"https://channels.strem.io/stremioget/stremio/v1"
	]
}
```

**NOTE** - You can pass either `addons`, or `endpoints`, or both. Passing an add-on with meta using `addons` is preferred, but if you only know the endpoint, it's OK to pass it under `endpoints`
