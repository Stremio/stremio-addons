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
	})

	node.once('ready', function() { cb(null, node) })
})

module.exports = function ipfsTransport(url)
{
	this.manifest = function(cb)
	{
		setupIPFS(function(err, node) {
			if (err)
				return cb(err)

			console.log(node)
		})
	}

	this.get = function(args, cb)
	{

	}
	// @TODO ipns, or otherwise do not open a pubsub
	// @TODO: anti-spam on the pubsub, and research whether all clients have to listen

	return this
}