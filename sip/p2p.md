# Stremio P2P addons (v3)

This document describes a new specification for Stremio add-ons, which allow much more freedom in how an add-on is created and hosted.

## Revised spec

Let us describe a v3 add-on as having:

1. A manifest
2. One or more metadata catalogs (listed in the manifest)
3. Supported type(s) and supported idPrefix(es) - used to determine whether to perform a `/stream/` or `/meta/`

The new add-on spec should have a much friendlier way of requesting things: access resources in following REST-like format:

```
/{resource}/{type}/{id}.json
```

For example: ```/stream/series/imdb:tt14.json```

Transports allowed should be HTTP and IPFS

In the case of IPFS, an IPNS-based URL will be accessed, and in case the object does not exist, it will be sent over an IPFS pubsub channel, and any responses signed by the add-on creator would be considered valid resolutions too




## Design goals

* The NodeJS-based SDK to make add-ons should have a simple API, and be able to publish an add-on *without needing a server/hosting infrastructure*

* The protocol should be simple enough to implement a hosted add-on with a basic HTTP library in any other language (Python, C#, etc.)

* The protocol should be simple enough to allow 'static' add-ons: directories of files, uploaded to GitHub pages or IPFS

* Simplify the entire client-side stack (stremio-addons, stremio-addons-user)



## Publishing

`publish` mode: e.g. `./myAddon --publish`; this would start an IPFS pubsub, upload the initial files (manifest and possibly catalogs) and then respond to all stream/details requests later on, and cache the response in IPFS

Additionally this mode will publish the result of stream/detail for the most popular pieces of content, without them being requested by peers first.

Alternatively this would be able to publish to a directory, but of course in that mode you'd be limited to what is initially published rather than receiving messages to request what's missing


## Cache 

Every response should have a certain caching policy.

We should return the policy in the JSON response itself, so as to make it transport agnostic. 
In the case of IPFS, we can implement an "always available" policy where even if something is expired, it would be served from an old version if a new response is found in N seconds.

For HTTP, the cache policy may be return in the form of HTTP headers as well.

## Add-on discovery

Peer to peer add-on discovery can be implemented via IPFS

## Other considerations

Consider an easy way of allowing videos to be replicated over IPFS