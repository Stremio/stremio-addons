const URL = require('url')
const fetch = require('node-fetch')
const errors = require('../errors')

// @TODO
module.exports = function legacyTransport(url)
{
	this.manifest = function(cb) 
	{
		req('meta', [], function(err, resp) {
			if (err)
				return cb(err)

			console.log(resp)
		})
	}

	this.get = function(args, cb) 
	{

	}

	function req(method, params, cb)
	{
		const body = JSON.stringify({ params: params, method: method, id: 1, jsonrpc: '2.0' })
		const reqUrl =url + '/q.json?b=' + new Buffer(body).toString('base64')

		fetch(reqUrl)
		.then(function(resp) {
			if (resp.status !== 200)
				return cb(errors.ERR_BAD_HTTP)
			
			return resp.json()
		})
		.then(function(resp) {
			cb(resp.error, resp.result)
		})
		.catch(cb)
	}

	return this
}