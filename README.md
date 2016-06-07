### Description

This package includes both Server and Client for a complete Add-on System.

Add-ons are being hosted server-side and support their own node modules. Their purpose is to respond to requests from the Client which will expect:

- a [manifest](/docs/manifest.md) (add-on description)
- an array of [meta elements](/docs/meta/meta.element.md) (primary meta feed)
- an array of [meta elements](/docs/meta/meta.element.md) (requested by search query)
- an array of [subtitle objects](/docs/subtitles/subtitles.object.md) (requested by ID)
- an array of [stream links](/docs/steam/stream.link.md) (requested by ID)
- one [meta element](/docs/meta/meta.element.md) (requested by ID)

### Documentation

- [Anatomy of an Add-on](/docs/README.md)
- [Manifest](/docs/manifest.md)
- [Meta Feed](/docs/api/meta/meta.feed.md)
- [Searching](/docs/api/meta/meta.search.md)
- [Meta Element](/docs/api/meta/meta.element.md)
- [Stream Link](/docs/api/stream/README.md)
- [Subtitles](/docs/api/subtitles/README.md)

### Tutorials

- [Testing Environments](/docs/tutorial/testing.md)
- [Using Cinemeta (meta API)](/docs/tutorial/using-cinemeta.md)
- [Add to Your App](/docs/tutorial/add.to.app.md)

### Demo Add-ons

- [Hello World](https://github.com/Ivshti/addon-helloworld)
- [Twitch.tv](https://github.com/jaruba/stremio-twitch)
- [Guidebox](http://github.com/Stremio/guidebox-stremio)
- [Filmon.tv](http://github.com/Stremio/filmon-stremio)
- [Local Files](http://github.com/Stremio/stremio-local-files)


_brought to you by [Stremio](http://www.strem.io/)_
