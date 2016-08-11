### Add to Your App

This package includes both Client and Server. The Client can be used to implement add-on support for any app.

```javascript
var addons = require("stremio-addons");
var stremio = new addons.Client({ /* options; picker: function(addons) { return addons } */ });
// specify a picker function to filter / sort the addons we'll use
// timeout: specify a request timeout
// respTimeout: specify response timeout
// disableHttps: use HTTP instead of HTTPS

stremio.add(URLtoAddon, { priority: 0 }); // Priority is an integer, the larger it is, the higher the priority
// OR
stremio.add(URLtoAddon);
// Priority determines which Add-on to pick first for an action, if several addons provide the same thing (e.g. streaming movies)

stremio.meta.get(args,cb); /* OR */ stremio.call("meta.get", args, cb);

// Events / hooks
stremio.on("pick", function(params) { 
	// called when picking addons
	// params.addons - all addons; you can modify this. e.g. params.addons = params.addons.filter(...)
	// params.method - the method we're picking for
	
	// this can be used instead of picker
});

stremio.on("addon-ready", function(addon, url) {
	// addon is an internal object - single Addon
	// url is the URL to it
});
```


#### Usage in browser 
```sh
browserify -r ./node_modules/stremio-addons/index.js:stremio-addons > stremio-addons.js
```
Or use the pre-built ``browser/stremio-addons.js`` with ``window.require("stremio-addons")``
```html
<script src="public/stremio-addons.js"></script>
<script>
var client = window.require("stremio-addons").Client();
/// ...
</script>
```
