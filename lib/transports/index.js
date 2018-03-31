module.exports = {
	// @TODO: should this be require('stremio-addons-transport-ipfs') etc etc
	// For example, we might want to replace 'ipfs' with a fallback that is a wrapper of the http transport using gateway.ipfs.io
	ipfs: require('./ipfs-shim'),
	http: require('./http'),
	legacy: require('./legacy')
}