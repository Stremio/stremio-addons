## DONE

* draft new client lib with `legacy` support; figure out the architecture of detection and etc.
* Write IPFS-based proto
* see if IPFS pubsub/room has signatures - it has peerId, so it should be secure - there are NO SIGNATURES
* implement built-in promisification
* very simple pubsub impl
* solve the js-ipfs lock issue so we can test N instances at the same time - see ipfs tests and etc
* learn IPFS architecture and re-evaluate the design
* consider localtunnel (lt) instead of pubsub, will be easier and more anonymous: BETTER MAKE IT TUTORIALS
* how does routing work currently in js-ipfs?? why does IPNS depend on "dht being implemented"; DHT is implemented since 0.24.0
* can we broadcast content requests via the DHT? can we improve pubsub? ; NOT A SMART IDEA
* IPFS impl to use pubusb to get missing; also re-eval the pubsub model, perhaps sending a message to someone in the swarm is sufficient
* figure out IPNS slowness and how to work around; also IPNS is not implemented in js-ipfs

## TODO

* implement and use `subtitles.json`, `subtitlesHash.json`
* consider the response formats
* consider cache - not-found items should refresh after a certain amount of time
* consider how to handle JSON parse errors and 404
* Move out SDK/docs to a new repo
* Move out client to a new repo
* Write Docs
* Write Spec
* Decide on the new set of modules - refreshed `stremio-models`
* tutorials like 'Create a hosted add-on with nodejs', 'Create a hosted add-on with Python', 'Create a hosted add-on with Go', 'Create a hosted add-on with PHP'
* example: publish an add-on via localtunnel; consider other possibilities that are easy


## TODO p2p

* learn how WebRTC works and whether we can provide nodes directly in the manifest (by peer ID and possibly addr)
#	mafintosh: https://github.com/mafintosh/hyperdht#dhtholepunchpeer-node-callback
#	read ipfs webrtc code and learn how they do signalling
#	read uTP code (libutp, node.js utp), see how this is supposed to punch 
	try to use libp2p directly over different networks (see examples)
	read out webrtc low-level code
- stremio addons Proto SDK, with http and ws (supernode) exposed connections ; test them in an automated test
* IPFS `requestUpdate` message: broadcast a message to the creator peer and "aggregator" peers to fetch / update an entry; use WebRTC 
* IPFS delegated nodes helping with routing and broadcasting/keeping track of `requestUpdate`
* IPNS over js-ipfs using the delegated routing nodes
* example addon based on the SDK
* tutorial: 'Create and publish a peer-to-peer addon with NodeJS'
* UI: figure out how to show add-ons that have not been online for a while - because they will just get increasingly outdated, but not offline