const fetch = require('node-fetch')
const errors = require('../errors')

// Legacy add-on adapter
// Makes legacy add-ons magically work with the new API
// This is very ugly but a necessary evil

module.exports = function legacyTransport(url)
{
	this.manifest = function(cb) 
	{
		jsonRPCRequest('meta', [], function(err, resp) {
			if (err)
				return cb(err)

			let v3Manifest
			let error

			cb(null, mapManifest(resp))
		})
	}

	this.get = function(args, cb) 
	{
		let resource = args[0]

		if (args.length !== 3)
			return cb(errors.ERR_UNSUPPORTED_RESOURCE)

		if (resource == 'catalog') {
			jsonRPCRequest('meta.find', [null, remapCatalog(args)], wrapResp('metas', cb))
		}
		else if (resource == 'meta') {
			jsonRPCRequest('meta.get', [null, remapMeta(args)], wrapResp('meta', cb))
		}
		else if (resource == 'stream') {
			jsonRPCRequest('stream.find', [null, remapStream(args)], wrapResp('streams', cb))
		}
		/*
		else if (resource == 'subtitles') {
			jsonRPCRequest('subtitles.find', [null, remapSubs(args)], wrapResp('subtitles', cb))
		}*/
		else {
			cb(errors.ERR_UNSUPPORTED_RESOURCE)
		}
	}

	function jsonRPCRequest(method, params, cb)
	{
		const body = JSON.stringify({ params: params, method: method, id: 1, jsonrpc: '2.0' })
		const reqUrl = url + '/q.json?b=' + new Buffer(body).toString('base64')

		fetch(reqUrl)
		.then(function(resp) {
			if (resp.status !== 200) return cb(errors.ERR_BAD_HTTP)
			else return resp.json()
		})
		.then(function(resp) {
			cb(resp.error, resp.result)
		})
		.catch(cb)
	}

	function wrapResp(name, cb) 
	{
		return function(err, res) {
			if (err) return cb(err)

			var o = { }
			o[name] = res
			return cb(null, o)
		}
	}

	function mapManifest(resp)
	{
		const manifest = resp.manifest
		let v3Manifest = {
			id: manifest.id,

			name: manifest.name,
			description: manifest.description,
			contactEmail: manifest.contactEmail,

			logo: manifest.logo,
			background: manifest.background,

			idProperty: manifest.idProperty,
			types: manifest.types,

			resources: [],
			catalogs: [],

			url: url,
			transport: 'legacy'
		}

		const sorts = Array.isArray(manifest.sorts) ? manifest.sorts : [ null ]

		if (resp.methods.indexOf('meta.find') !== -1) {
			sorts.forEach(function(sort) {
				((sort && sort.types) || manifest.types).forEach(function(type) {
					if (! type) return

					let key = type
					if (sort) {
						key += ':' + sort.prop
						if (sort.countryCode) key += ':COUNTRY'
					}

					v3Manifest.catalogs.push({ type: key, id: 'top' })
				})
			})
		}

		if (resp.methods.indexOf('meta.get') !== -1)
			v3Manifest.resources.push('meta')

		if (resp.methods.indexOf('stream.find') !== -1)
			v3Manifest.resources.push('stream') 

		return v3Manifest
	}

	function remapCatalog(args)
	{
		let spl = args[1].split(':')
		let req = { query: { type: spl[0] }, limit: 70 }

		if (spl[1]) {
			// Just follows the convention set out by stremboard
			// L287 cffb94e4a9c57f5872e768eff25164b53f004a2b
			req.query.sort = { }
			req.query.sort[spl[1]] = -1
			req.query.sort['popularity'] = -1
		}
		if (spl[2]) req.countryCode = spl[2].toLowerCase()

		return req
	}

	function remapMeta(args)
	{
		let req = { query: { } }

		// type is not used
		const id = args[2].split(':')
		if (id[0].match('^tt')) req.query.imdb_id = id[0]
		else req.query[id[0]] = id[1]

		return req
	}

	function remapStream(args)
	{
		let req = { query: { } }

		req.query.type = args[1]
		
		let id = args[2].split(':')
		if (id[0].match('^tt')) {
			req.query.imdb_id = id[0]
			id = id.slice(1)
		} else {
			req.query[id[0]] = id[1]
			id = id.slice(2)
		}

		if (id.length == 2) {
			req.query.season = parseInt(id[0])
			req.query.episode = parseInt(id[1])
		}
		if (id.length == 1) {
			req.query.video_id = id[0]
		}

		return req
	}

	/*
	function remapSubs(args) 
	{
		// @TODO
		return req
	}*/

	// Examples
	//console.log(remapStream(['stream', 'channel', 'yt_id:UCaFoZFhV1LgbFIB3-6zdWVg:OLT7x6mpBq4']))
	//console.log(remapStream(['stream', 'series', 'tt0386676:1:1']))

	return this
}
