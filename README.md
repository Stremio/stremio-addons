# stremio-addons
An Add-ons system that works like an RPC system, however it allows to **chain multiple Add-ons** and it automatically selects which addon to handle the call, depending on the arguments and the priority of add-ons (e.g. get a stream). You can also issue calls to all Add-ons and aggregate results (e.g. search metadata).

#### Provides

* **Add-on server library**: what we use to initialize an HTTP server that provides a Stremio add-on.
* **Add-on client library**: a client library to use one or more Stremio add-ons

## Client
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


## Server
```javascript
var addons = require("stremio-addons");
new addons.Server({
	"meta.get": function(args, cb) {
		// this.user -> get info about the user
	},
}, { secret: "SOME SECRET - or leave undefined for test secret" });

```

## Authentication
To authenticate when using Stremio Addons as a client, one must call
```javascript
client.setAuth(/* CENTRAL SERVER */, /* USER SESSION TOKEN (authToken) OR ADDON SECRET */);
```

**The authToken** is a session ID we use for addon clients to identify the user. The Addon Server (implemented in server.js) is responsible for evaluating if we're getting requests from a logged-in users. That happens by asking the **central server** if that authToken is valid and belongs to a user. 

**The secret** is a token, issued by a central server that we use to identify our Add-on server to the central server. We can also use our secret to identify ourselves to other Add-ons, if using them as a client - if our Add-on uses other Stremio add-ons under the hood (through the client library).
