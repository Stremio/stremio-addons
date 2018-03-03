const URL = require('url')
const fetch = require('node-fetch')
const errors = require('./errors')

const SUPPORTED_PROTOCOLS = [
	'ipfs',
	'', 'http', 'https' // those all represent http
]

const transports = {
	// @TODO: should this be require('stremio-addons-transport-ipfs') etc etc
	// For example, we might want to replace 'ipfs' with a fallback that is a wrapper of the http transport using gateway.ipfs.io
	ipfs: require('./transports/ipfs'),
	http: require('./transports/http'),
	legacy: require('./transports/legacy')
}

function AddonClient(manifest)
{
	// manifest.transport
	// manifest.url

	const Transport = transports[manifest.transport]
	if (! transport) 
		throw 'invalid manifest.transport'


	// @TODO: construct the transport

}

AddonClient.detectFromURL = function(url, cb) 
{
	// Detects what a URL is
	// possible outcomes: repository or addon (addons have 3 different transports)

	const parsed = URL.parse(url)

	if (SUPPORTED_PROTOCOLS.indexOf(parsed.protocol) === -1)
		return cb(errors.ERR_PROTOCOL)

	//if (parsed.protocol === 'ipfs')
	//

	cb(errors.ERR_UNRECOGNIZED)
}

module.exports = AddonClient