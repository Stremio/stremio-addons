const transports = require('./transports')
const detectFromURL = require('./detectFromURL')

// The node.js promisify does not support still using callbacks (detection whether a cb is passed)
//const promisify = require('util').promisify
const promisify = require('./util/promisify')

module.exports.AddonClient = function AddonClient(manifest, transport)
{
	this.manifest = manifest
	this.get = promisify(function()
	{
		let args = Array.prototype.slice.call(arguments)
		let cb = args.pop()
		if (typeof(cb) !== 'function') throw 'cb is not a function'
		if (args.length < 2) throw 'args min length is 1'
		transport.get(args, cb)
	})

	this.destroy = promisify(function(cb) 
	{
		if (transport.destroy) transport.destroy(cb)
	})

	return this
}

module.exports.detectFromURL = promisify(detectFromURL)

// This function is different in that it will return immediately,
// but might update the manifest once it loads (hence the cb)
module.exports.constructFromManifest = promisify(function(manifest, cb)
{
	const Transport = transports[manifest.transport]
	transport = new Transport(manifest.url) 
	
	let addon = new AddonClient(manifest, transport)

	transport.manifest(function(err, newManifest) {
		if (err)
			return cb(err)

		// Keep these values from the original
		newManifest.transport = manifest.transport
		newManifest.url = manifest.url

		addon.manifest = newManifest
		cb(null, addon)
	})

	return addon
})

