## Stremio Add-ons

#### _All of the video content [Stremio](http://www.strem.io/) provides, it gets exclusively through this add-on system, with no content or specific provider being built into the app._

This package includes both Server and Client for a complete Add-on System.

Add-ons are being hosted separately (on a server). As such, they have increased security and support their own node modules.

### What do they do?

The purpose of an add-on is to gather media content (not to extend app features) and respond to requests from the Client which will expect:

- a [manifest](/docs/api/manifest.md) (add-on description)
- an array of [meta elements](/docs/api/meta/meta.element.md) (primary meta feed)
- an array of [meta elements](/docs/api/meta/meta.element.md) (requested by search query)
- one [meta element](/docs/api/meta/meta.element.md) (requested by ID)
- an array of [subtitle objects](/docs/api/subtitles/subtitles.object.md) (requested by ID)
- an array of [stream links](/docs/api/stream/stream.response.md) (requested by ID)

### Benefits

- [Benefits of creating an add-on for Stremio](/docs/BENEFITS.md)


### Documentation

- [Getting started & Anatomy of an Add-on](/docs/README.md)
- [Manifest](/docs/api/manifest.md)
- [Meta Feed](/docs/api/meta/meta.find.md)
- [Searching](/docs/api/meta/meta.search.md)
- [Meta Element](/docs/api/meta/meta.element.md)
- [Stream Link](/docs/api/stream/README.md)
- [Subtitles](/docs/api/subtitles/README.md)

### Tutorials

- [Scaffolding an Add-on](/docs/tutorial/scaffolding.md)
- [Creating an Add-on](https://github.com/Stremio/addon-helloworld)
- [Hosting your Add-on](/docs/tutorial/hosting.md)
- [Publishing an Add-on](/docs/tutorial/publishing.md)
- [Testing Environments](/docs/tutorial/testing.md)
- [Using Cinemeta (meta API)](/docs/tutorial/using-cinemeta.md)
- [Using add-ons client in browser](/docs/tutorial/using-in-browser.md)
- [Add to Your App](/docs/tutorial/add.to.app.md)
- [Hosting multiple add-ons](https://github.com/Stremio/stremio-addons-box)

### Demo Add-ons

- [Hello World](https://github.com/Stremio/addon-helloworld) - basic explanation of how to create a streaming add-on
- [Twitch.tv](https://github.com/Stremio/stremio-twitch) - streams live from Twitch.tv
- [Local Files](http://github.com/Stremio/stremio-local-files) - indexes files found locally and puts them in Stremio
- [Filmon.tv](http://github.com/Stremio/filmon-stremio) - adds TV catalogue from Filmon.tv with streaming
- [WatchHub](http://github.com/Stremio/stremio-watchhub) - redirects to official sources where you can stream movies/series
- [OpenSubtitles](http://github.com/Stremio/stremio-opensubtitles) - find subtitles automatically for the played video file

_brought to you by [Stremio](http://www.strem.io/)_
