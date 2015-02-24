Client
```javascript
var stremio = new Stremio();
stremio.addService(URL, { priority: 0 }); // Priority is an integer, zero is the highest priority

stremio.meta.get(args,cb); /* OR */ stremio.call("meta.get", args, cb);
```


