# Stremio P2P addons

The new add-on spec should have a much friendlier way of requesting things: serialize the query as a string in the following format:

```
/{method}/{type}/{id}.json
```

For example: ```/stream.find/series/my-addon:14.json```

Transports allowed should be HTTP and IPFS

In the case of IPFS, an IPNS-based URL will be accessed, and in case the object does not exist, it will be sent over an IPFS pubsub channel, and any responses signed by the add-on creator would be considered valid resolutions too.


## Other considerations

Consider an easy way of allowing videos to be replicated over IPFS
