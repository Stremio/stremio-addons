Client
========
```javascript
var services = require("stremio-services");
var stremio = new services.Client({ /* options; picker: function(services) { return services } */ });
// specify a picker function to filter / sort the services we'lll use

stremio.setAuth(url, authKey); // Set the authentication for services that require auth
// URL is the URL to the central authentication server - some services only permit certain servers
// authKey is the authentication token

stremio.addService(URL, { priority: 0 }); // Priority is an integer, zero is the highest priority

stremio.meta.get(args,cb); /* OR */ stremio.call("meta.get", args, cb);
```


Server
=======
```javascript
var services = require("stremio-services");
new services.Server({
	"meta.get": function(args, cb) {
		// this.user -> get info about the user
	},
});
```
