const transports = require('./transports')
const detectFromURL = require('./detectFromURL')

function AddonClient(manifest, transport)
{
	this.manifest = manifest
	this.get = transport.get.bind(transport)

	return this
}

AddonClient.detectFromURL = detectFromURL

// This function is different in that it will return immediately,
// but might update the manifest once it loads (hence the cb)
AddonClient.constructFromManifest = function(manifest, cb)
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
}

module.exports = AddonClient