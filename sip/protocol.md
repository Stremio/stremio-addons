# Stremio Add-on Protocol

The Stremio addon protocol defines a universal interface to describe multimedia content. It can describe catalogs, detailed metadata and streams related to multimedia content.

It is typically transported over HTTP or IPFS.

This allows Stremio or other similar applications to aggregate content seamlessly from different sources, for example YouTube, Twitch, iTunes, Netflix, DTube and others. It also allows developers to build such add-ons with minimal skill.

To define a minimal add-on, you only need an HTTP server/endpoint serving a `manifest.json` file and responding to resource requests at `/{resource}/{type}/{id}.json`.

Currently used resources are: `catalog`, `meta`, `stream`. The JSON format of those resources is described [here]().

Here is a minimal example:

`manifest.json`:

```
TODO
```

`/catalogs/movie/top.json`:


`/stream/movie/tt1254207.json`:

This add-on is so simple that it can actually be hosted statically on GitHub pages! [See example]()