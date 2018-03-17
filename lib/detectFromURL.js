const URL = require('url')
const fetch = require('node-fetch')
const errors = require('./errors')
const client = require('./client')
const transports = require('./transports')

const SUPPORTED_PROTOCOLS = [
	'ipfs:', 'ipns:',
	':', 'http:', 'https:' // those all represent http
]

module.exports = function detectFromURL(url, cb) 
{
	// Detects what a URL is
	// possible outcomes: repository or addon (addons have 3 different transports)

	const parsed = URL.parse(url)

	if (SUPPORTED_PROTOCOLS.indexOf(parsed.protocol) === -1)
		return cb(errors.ERR_PROTOCOL)

	if (parsed.protocol === 'ipfs:' || parsed.protocol === 'ipns:') {
		constructFromTransport(new transports.ipfs(url), cb)
		return
	}

	const isManifest = parsed.pathname.match(/manifest\.json$/)
	const isJSON = parsed.pathname.match(/\.json$/)

	fetch(url)
	.then(function(resp) {
		if (resp.status !== 200)
			return cb(errors.ERR_BAD_HTTP)

		const contentType = resp.headers.get('content-type')
		const isHeaderJSON = contentType && contentType.indexOf('application/json') !== -1

		const urlToManifest = resp.headers.get('x-stremio-addon')

		if (urlToManifest) {
			// Detected as an HTTP add-on
			constructFromTransport(new transports.http(urlToManifest), cb)
			return
		} else if (! (isHeaderJSON || isManifest || isJSON)) {
			// Detected as a legacy add-on
			constructFromTransport(new transports.legacy(url), cb)
			return
		}

		return resp.json().then(function(resp) {
			// Detected as a repository
			if (typeof(resp.name) === 'string' && Array.isArray(resp.addons)) {
				cb(null, { repository: resp })
				return
			}

			// Detected as an HTTP add-on
			if (isManifest && resp.id) {
				cb(null, { addon: new client.AddonClient(resp, new transports.http(url)) })
				return
			}

			return cb(errors.ERR_RESP_UNRECOGNIZED)
		})
	})
	.catch(cb)
}

function constructFromTransport(transport, cb)
{
	transport.manifest(function(err, manifest) {
		if (err) cb(err)
		else cb(null, { addon: new client.AddonClient(manifest, transport) })
	})
}