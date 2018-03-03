const fetch = require('node-fetch')
const errors = require('../errors')

module.exports = function httpTransport(url)
{
	// url should point to manifest.json 

	this.manifest = function(cb) 
	{
		req(url, cb)
	}

	this.get = function(args, cb)
	{
		const reqUrl = url.replace('/manifest.json', '/'+args.join('/')+'.json')
		req(reqUrl, cb)
	}

	function req(url, cb)
	{
		fetch(url)
		.then(function(resp) { 
			if (resp.status === 404)
				return cb(errors.ERR_NOT_FOUND)

			return resp.json()
				.then(function(resp) { cb(null, resp) })
		})
		.catch(cb)
	}

	return this
}