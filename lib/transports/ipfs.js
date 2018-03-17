const URL = require('url')
const errors = require('../errors')
const IPFS = require('ipfs')
const Room = require('ipfs-pubsub-room')
const thunky = require('thunky')

const IPFSRepo = require('ipfs-repo')
// Potentially for IPFSRepo
//const path = require('path')
//const os = require('os')

// @TODO: retry logic
const TIME_TO_RETR_MISSING = 6 * 1000

const setupIPFS = thunky(function(cb) {
	const node = new IPFS({ 
		EXPERIMENTAL: {
		 	pubsub: true
		},

		// takes path; the impl can take memory
		repo: new IPFSRepo('./', { lock: 'memory' }),

 		// overload the default IPFS node config, find defaults at https://github.com/ipfs/js-ipfs/tree/master/src/core/runtime
		config: {
			Addresses: {
				Swarm: [
					// @todo: sockets, webrtc, web browser compatible
					'/ip4/127.0.0.1/tcp/1338',
					//'/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star',
				]
			},
			Bootstrap: [
				'/ip4/127.0.0.1/tcp/4001/ipfs/QmYRaTC2DqsgXaRUJzGFagLy725v1QyYwt66kvpifPosgj',
			],
			Discovery: {
				MDNS: {
					Enabled: false
				}
			}
		},
	})

	node.once('ready', function() {
		cb(null, node) 
	})

	// @TODO
	node.on('error', (err) => { console.error(err) })
})

module.exports = function ipfsTransport(url)
{
	const manifestUrl = url.replace('ipfs://', '/ipfs/')
	const base = manifestUrl.replace('/manifest.json', '/')

	this.manifest = function(cb)
	{
		setupIPFS(function(err, node) {
			if (err) return cb(err)
			retrFile(node, manifestUrl, function(err, resp) {
				if (err) return cb(err)
				if (!resp || typeof(resp.id) !== 'string')
					return cb(errors.ERR_MANIFEST_INVALID)

				node.addonRoom = Room(node, resp.id)
				node.addonRoom.on('subscribed', function() {
					cb(null, resp)
				})
				// @TODO TEMP
				//node.addonRoom.on 'peer joined' 'peer left' 'subscribed'
			})
		})
	}

	this.get = function(args, cb)
	{
		setupIPFS(function(err, node) {
			if (err) return cb(err)

			if (! node.addonRoom)
				return cb(errors.ERR_MANIFEST_CALL_FIRST)

			const p = args.join('/')
			retrFile(node, base+p+'.json', function(err, res) {
				if (err && err.message.match('No such file')) {
					node.addonRoom.broadcast(p)

					setTimeout(function() {
						retrFile(node, base+p+'.json', cb)
					}, TIME_TO_RETR_MISSING)
					return
				}

				cb(err, res)
			})
		})
	}

	this.destroy = function(cb)
	{
		// @XXX: if you call this without calling manifest/get before, it will create a instance and then kill it
		setupIPFS(function(err, node) {
			if (err) return cb(err)
			node.stop(cb)
		})
	}

	function retrFile(node, p, cb)
	{
		node.files.cat(p, function(err, res) {
			if (err)
				return cb(err)

			try { 
				res = JSON.parse(res.toString())
			} catch(e) {
				return cb(err)
			}

			cb(null, res)
		})
	}
	// @TODO ipns, or otherwise do not open a pubsub
	// @TODO: anti-spam on the pubsub, and research whether all clients have to listen

	return this
}