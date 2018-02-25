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


## Design goals

* The NodeJS-based SDK to make add-ons should have a simple API, and be able to publish an add-on *without needing a server/hosting infrastructure*

* The protocol should be simple enough to implement a hosted add-on with a basic HTTP library in any other language (Python, C#, etc.)

* The protocol should be simple enough to allow 'static' add-ons: directories of files, uploaded to GitHub pages or IPFS

* Simplify the entire client-side stack (stremio-addons, stremio-addons-user)