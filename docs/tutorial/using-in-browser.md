## Using in browser 

To use the client library in a browser you can just include the minified or non-minified script from the [`browser/`](https://github.com/Stremio/stremio-addons/tree/master/browser) directory of this project. 

To use with a browserify bundle, you can require the `index-browser.js` file.

For example:

```javascript
var browserify = require('browserify')

var b = browserify()

b.require('./index-browser.js', { expose: 'stremio-addons' })

b.bundle().pipe(require('fs').createWriteStream('stremio-addons.js'))
```

Then add it to your browser app:

```
<script src='stremio-addons.js'></script>
```

And initialize as normal:

```
var Stremio = require('stremio-addons')
var client = new Stremio.Client()
```