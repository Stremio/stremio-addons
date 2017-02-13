### Testing Environment

Add-ons can be tested in two ways.

**Testing with [stremio-addons-client](https://github.com/Ivshti/stremio-addons-client)**

- Install & Run [stremio-addons-client](https://github.com/Ivshti/stremio-addons-client)
- Run your add-on with `npm start`
- Go to the `stremio-addons-client` url
- Open the "Add-ons" tab
- Add your add-on url (ie: `http://localhost:9005`, remember to use your add-on's port) to the "Add new add-on" form

**Testing with [Stremio](http://www.strem.io/) versions 3.6 or earlier**

- On Windows, run Stremio with:

```
stremio . --services=http://localhost:9005/stremio/v1/stremioget
```

- On OSX / Linux, open a terminal in your add-on's directory, and do:

```
open stremio://localhost:7000/stremio/v1 & # Load this add-on in Stremio
PORT=7000 node index # Start the add-on server
```

**TIP:** in Stremio 3.6, results from local add-ons are still cached. To work around this while development, you can prepend anything (e.g. number) before `/stremio/v1`. For example, `http://localhost:9005/cache-break-2/stremio/v1/stremioget`.


**Testing with [Stremio](http://www.strem.io/) versions 4.0 or later**

Open your browser at `http://127.0.0.1:11470/#?addon=ADDON_URL`, where `ADDON_URL` is the url to your add-on.
