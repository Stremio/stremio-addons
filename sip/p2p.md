# Stremio P2P addons (v3)

This document describes a new specification for Stremio add-ons, which allow much more freedom in how an add-on is created and hosted.

## Revised spec

( @TODO: move this to a separate doc )

Let us describe a v3 add-on as having:

1. A manifest
2. One or more metadata catalogs (listed in the manifest)
3. Supported type(s) and supported idPrefix(es) - used to determine whether to perform a `/stream/` or `/meta/`

The new add-on spec should have a much friendlier way of requesting things: access resources in following REST-like format:

```
/{resource}/{type}/{id}.json
```

Or alternatively

```
/{resource}/{type}/{id}/{extraArgs}.json
```

Where extraArgs is a querystring-encoded object

For example: ```/stream/series/tt14.json```

Transports allowed should be HTTP and IPFS

In the case of IPFS in case the object does not exist, a `requestUpdate` message will be sent to the add-on creator peer (referenced by ID/pubkey via `peerRouting.findPeer`), and other delegated nodes (which might forward to the creator peer) - and we will wait a certain time to see if the content will be updated by the add-on publishing an updated version of itself. It's possible that a message of a new `addonDescriptorSigned` (see Addon Discovery) will be broadcasted back through the delegated nodes, telling the client to grab the content from this newer version.

This message would also be sent if we consider the object outdated.



## Design goals

* The NodeJS-based SDK to make add-ons should have a simple API, and be able to publish an add-on *without needing a server/hosting infrastructure*

* The protocol should be simple enough to implement a hosted add-on with a basic HTTP library in any other language (Python, C#, etc.)

* The protocol should be simple enough to allow 'static' add-ons: directories of files, uploaded to GitHub pages or IPFS

* Simplify the entire client-side stack (stremio-addons, stremio-addons-user)


## Publishing

`publish` mode: e.g. `./myAddon --publish`; this would start an IPFS node, upload the initial files (manifest and possibly catalogs) and then respond to all stream/details requests later on (`requestUpdate`), and upload the response in IPFS

You have to keep this running in order for your add-on to update it's own content

Additionally this mode will publish the result of stream/detail for the most popular pieces of content, without them being requested by peers first.

Alternatively this would be able to publish to a directory, but of course in that mode you'd be limited to what is initially published rather than receiving messages to request what's missing


## Bootstrapping / dev friendliness

* after one npm command, you should be able to initialize sample add-on
* after starting the add-on, it should open in stremio or the open-source client; it's really important that opening the addon in a linter and a client is very easy
* basically distinct starting a local addon server in two modes: ``--publish`` and ``--dev`` (default); where the ``--dev`` mode would prompt an existing stremio to open WITH the addon or warn the dev when there is no open stremio and provide `app.strem.io` fallback
* detailed logging that shows what's happening and what's being asked from stremio
* stremio-addons renamed to stremio-addons-sdk

## Cache 

Every response should have a certain caching policy.

We should return the policy in the JSON response itself, so as to make it transport agnostic. 
In the case of IPFS, we can implement an "always available" policy where even if something is expired, it would be served from an old version if a new response is found in N seconds.

For HTTP, the cache policy may be return in the form of HTTP headers as well.

## Add-on discovery

Peer to peer add-on discovery can be implemented via IPFS, using the routing (DHT). You would publish an add-on to the DHT, by publishing it's addonDescriptorSigned, which is a signed message of hash({ transportUrl, transportName, manifest }) (AddonDescriptorHash)

## User identification / authentication

HTTP-based transport may support user identification and possibly authentication.

Simplest form of that is just to send a unique, anonymous UID as an HTTP header when fetching content.

This can be achieved by an universal API in `stremio-addons-client` to set header for every request (for example `X-User-ID`)

## Bridge from BitTorrent/HTTP

Consider an easy way of allowing files to be replicated over IPFS from sources like HTTP and BitTorrent *dynamically*. Dynamically means we wouldn't need the full file at once in order to upload it to IPFS.

This can be done by gradually uploading chunks from the underlying source (HTTP or BitTorrent), when we have them, as IPFS blocks. Those blocks will also be IPFS objects, which means they follow markedag protobufs spec, and are of the `blob` type, meaning they only contain data (rather than references).

The IPFS object hashes will be broadcasted on an IPFS pubsub channel, along with some metadata on what range they represent, as a signed message from the relayer.

Once the whole underlying file has been retrieved, we can create an IPFS object that is a `list`, which means it will reference all the other IPFS objects of the `blob` to make one complete file.

Once this is done, it will broadcast the final IPFS object.

This can be used to aid and magically p2p-ify video distribution from HTTP to IPFS.


## Supernodes (delegated nodes)

To aid using the decentralized system in resource limited environments and the browser, we can introduce a concept of a "supernode". Delegated nodes (supernodes) would be *all add-on creator nodes*, and some pre-set nodes (similar to DHT bootstrap nodes and [IPFS bootstrappers](https://github.com/libp2p/js-libp2p/blob/b871bb0a1ab400d76aa6808ed26fc905f64bc515/examples/libp2p-in-the-browser/1/src/browser-bundle.js#L13)).

We don't really need to 'discover' the delegated nodes: we will have a hardcoded list of multiaddrs (see [IPFS browser config](https://github.com/ipfs/js-ipfs/blob/master/src/core/runtime/config-browser.json)) and the stremio-addon-sdk would include node ID and WebSocket multiaddr address(es) in the manifest by default. Also, WebRTC peers do not need to be discovered, instead they can be found directly with a multiaddr derived from the ID via the webrtc-star signalling mechanism - see https://github.com/libp2p/js-libp2p/tree/master/examples/libp2p-in-the-browser. Furthermore, those can be derived by taking all add-ons the central `addoncollection.json` knows about and seeing if they have IPFS nodes (all `transportUrl`'s that are to IPFS).

Such a node could be doing delegated routing (see https://github.com/ipfs/notes/issues/162), relaying `requestUpdate` messages, and caching content so as to make it more available (and over more transports).

Those nodes should expose WebSockets and WebRTC transports - both are compatible with the browser and have complementing strengths (e.g. WS is less resource intense and can go behind CloudFlare)

The user would send `requestUpdate` message to all their delegated nodes, and use them for resolving names. This improves performance, and also ensures all add-ons receive the `requestUpdate` message.

The add-on SDK can ensure add-on creators run supernodes by either shipping the go binaries for ipfs or by using `js-ipfs`. The go version might be needed because we need full DHT support.