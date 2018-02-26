# Stremio P2P addons (v3)

This document describes a new specification for Stremio add-ons, which allow much more freedom in how an add-on is created and hosted.

## Revised spec

The new add-on spec should have a much friendlier way of requesting things: serialize the query as a string in the following format:

```
/{method}/{type}/{id}.json
```

For example: ```/stream.find/series/my-addon:14.json```

Transports allowed should be HTTP and IPFS

In the case of IPFS, an IPNS-based URL will be accessed, and in case the object does not exist, it will be sent over an IPFS pubsub channel, and any responses signed by the add-on creator would be considered valid resolutions too.


## Other considerations

Consider an easy way of allowing videos to be replicated over IPFS

This revised protocol should allow as asy as possible introspection into what is available in the add-on. IPFS-based cache of all responses solves that.



## Design goals

* The NodeJS-based SDK to make add-ons should have a simple API, and be able to publish an add-on *without needing a server/hosting infrastructure*

* The protocol should be simple enough to implement a hosted add-on with a basic HTTP library in any other language (Python, C#, etc.)

* The protocol should be simple enough to allow 'static' add-ons: directories of files, uploaded to GitHub pages or IPFS

* Simplify the entire client-side stack (stremio-addons, stremio-addons-user)



## Publishing

`publish` mode: e.g. `./myAddon --publish`; this would start an IPFS pubsub, upload the initial files (manifest and possibly catalogues) and then respond to all stream/details requests later on, and cache the response in IPFS

Additionally this mode will publish the result of stream/detail for the most popular pieces of content, without them being requested by peers first.

Alternatively this would be able to publish to a directory, but of course in that mode you'd be limited to what is initially published rather than receiving messages to request what's missing


## Cache 

Every response should have a certain caching policy.

We should return the policy in the JSON response itself, so as to make it transport agnostic. 
In the case of IPFS, we can implement an "always available" policy where even if something is expired, it would be served from an old version if a new response is found in N seconds.

For HTTP, the cache policy may be return in the form of HTTP headers as well.


## Scribbles

```
addon spec work
	1) think of a global add-on index that contains info about what is available in which add-ons; related to the notification index?
	2) if an add-on is auto-scraped by a publish script, then we KNOW which movies are in it and we can list them (meta.find or even a global index)
 	3) maybe the p2p spec can define addons in a way that's already friendly to this - "addon is a db"?
 	4) a global crawler would help a lot with the stremio UX

	meta.find / manifest / etc. reverse introspection: the response of that should return some info on how it should be displayed
	https://ipfs.io/blog/25-pubsub/

	script / docs to host on IPFS/gh-pages (export static files)
	tool to publish on github pages

	subtitles to NOT be a local addon

```

