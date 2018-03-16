## DONE

* draft new client lib with `legacy` support; figure out the architecture of detection and etc.
* Write IPFS-based proto
* see if IPFS pubsub/room has signatures - it has peerId, so it should be secure - there are NO SIGNATURES

## TODO

* solve the js-ipfs lock issue so we can test N instances at the same time - see ipfs tests and etc
* consider localtunnel (lt) instead of pubsub, will be easier and more anonymous
* or a very simple pubsub impl
* learn how WebRTC works and whether we can provide nodes directly in the manifest (by peer ID and possibly addr)
* IPFS impl to use pubusb to get missing; also re-eval the pubsub model, perhaps sending a message to someone in the swarm is sufficient
* IPFS-based SDK implementation
* example addon
* implement and use `subtitles.json`, `subtitlesHash.json`
* figure out IPNS slowness and how to work around
* consider the response formats
* consider cache - not-found items should refresh after a certain amount of time
* consider how to handle JSON errors and 404
* Write docs
* Write spec
* Decide on the new set of modules - refreshed `stremio-models`
* tutorials like 'Create and publish a peer-to-peer addon with NodeJS' or 'Create a hosted add-on with nodejs', 'Create a hosted add-on with Python', 'Create a hosted add-on with Go', 'Create a hosted add-on with PHP'
* considering IPFS-based add-ons will be experimental, decide what to advise developers
* learn IPFS architecture and re-evaluate the design