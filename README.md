Client
========
```javascript
var services = require("stremio-services");
var stremio = new services.Client();
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
