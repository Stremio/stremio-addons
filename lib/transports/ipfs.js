const URL = require('url')
const errors = require('../errors')

module.exports = function ipfsTransport(url)
{
	// @TODO ipns, or otherwise do not open a pubsub
	// @TODO: anti-spam on the pubsub, and research whether all clients have to listen

	return this
}