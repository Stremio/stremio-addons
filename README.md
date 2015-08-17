stremio-addons
================
An Add-ons system that works like an RPC system, however it allows to chain multiple Add-ons for an end-point and it automatically selects which addon to handle the call, depending on the arguments and the priority of add-ons.


Client
========
```javascript
var addons = require("stremio-addons");
var stremio = new addons.Client({ /* options; picker: function(addons) { return addons } */ });
// specify a picker function to filter / sort the addons we'll use

stremio.setAuth(url, authKey); // Set the authentication for addons that require auth
// URL is the URL to the central authentication server - some addons only permit certain servers
// authKey is the authentication token

stremio.add(URL, { priority: 0 }); // Priority is an integer, zero is the highest priority

stremio.meta.get(args,cb); /* OR */ stremio.call("meta.get", args, cb);

// Events / hooks
stremio.on("pick", function(params) { 
	// called when picking addons
	// params.addons - all addons; you can modify this. e.g. params.addons = params.addons.filter(...)
	// params.method - the method we're picking for
	
	// this can be used instead of picker
});
```


Server
=======
```javascript
var addons = require("stremio-addons");
new addons.Server({
	"meta.get": function(args, cb) {
		// this.user -> get info about the user
	},
}, { allow: ["api.linvo.me"], secret: "SOME SECRET" });

```

Secret & authToken
==============
The authToken is a session ID we use for addon clients to identify the user. It's the addon' job (implemented in server.js) to evaluate if we're getting requests from a logged-in users. That happens by asking the central server if that authToken is valid.

The secret is a token that is used to get the central server (regulating) to authorize on the user's session. We can also use the secret as an auth token for clients with .setAuth() in order to get a special session to get addons to use each other.
