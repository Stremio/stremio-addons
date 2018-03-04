const URL = require('url')
const errors = require('../errors')
const IPFS = require('ipfs')
const Room = require('ipfs-pubsub-room')
const thunky = require('thunky')

const setupIPFS = thunky(function(cb) {
	const node = new IPFS({ 
		EXPERIMENTAL: {
		 	pubsub: true
		},

		config: { // overload the default IPFS node config, find defaults at https://github.com/ipfs/js-ipfs/tree/master/src/core/runtime
			Addresses: {
				Swarm: [
					// @todo: sockets, webrtc, web browser compatible
					'/ip4/127.0.0.1/tcp/1337'
				]
			},
			// @TODO: external file
			Bootstrap: [
			'/ip4/127.0.0.1/tcp/4001/ipfs/QmYRaTC2DqsgXaRUJzGFagLy725v1QyYwt66kvpifPosgj',
			"/ip4/104.131.131.82/tcp/4001/ipfs/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ",
			"/ip4/104.236.176.52/tcp/4001/ipfs/QmSoLnSGccFuZQJzRadHn95W2CrSFmZuTdDWP8HXaHca9z",
			"/ip4/104.236.179.241/tcp/4001/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM",
			"/ip4/162.243.248.213/tcp/4001/ipfs/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm",
			"/ip4/128.199.219.111/tcp/4001/ipfs/QmSoLSafTMBsPKadTEgaXctDQVcqN88CNLHXMkTNwMKPnu",
			"/ip6/2604:a880:1:20::1f9:9001/tcp/4001/ipfs/QmSoLnSGccFuZQJzRadHn95W2CrSFmZuTdDWP8HXaHca9z",
			"/ip6/2604:a880:1:20::203:d001/tcp/4001/ipfs/QmSoLPppuBtQSGwKDZT2M73ULpjvfd3aZ6ha4oFGL1KrGM",
			"/ip6/2604:a880:0:1010::23:d001/tcp/4001/ipfs/QmSoLueR4xBeUbY9WZ9xGUUxunbKWcrNFTDAadQJmocnWm",
			"/ip6/2a03:b0c0:0:1010::23:1001/tcp/4001/ipfs/QmSoLer265NRgSp2LA3dPaeykiS1J6DifTC88f5uVQKNAd",
			"/ip6/2a03:b0c0:1:d0::e7:1/tcp/4001/ipfs/QmSoLMeWqB7YGVLJN3pNLQpmmEk35v6wYtsMGLzSr5QBU3",
			"/ip6/2604:a880:1:20::1d9:6001/tcp/4001/ipfs/QmSoLju6m7xTh3DuokvT3886QRYqxAzb1kShaanJgW36yx"
			],
		},
	})

	node.once('ready', function() { cb(null, node) })

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
			retrFile(node, manifestUrl, cb)
		})
	}

	this.get = function(args, cb)
	{
		setupIPFS(function(err, node) {
			if (err) return cb(err)
			retrFile(node, base+args.join('/')+'.json', cb)
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