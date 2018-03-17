#!/usr/bin/env node

const AddonClient = require('../lib/client')
const errors = require('../lib/errors')

const tape = require('tape')

tape('detectFromURL: invalid protocol', function(t) {
	AddonClient.detectFromURL('ftp://cinemeta.strem.io', function(err, res) {
		t.equals(err, errors.ERR_PROTOCOL, 'err is the right type')
		t.notOk(res, 'no response')
		t.end()
	})
})

tape('detectFromURL: legacy protocol', function(t) {
	// https://cinemeta.strem.io/stremioget/stremio/v1/q.json?b=eyJwYXJhbXMiOltdLCJtZXRob2QiOiJtZXRhIiwiaWQiOjEsImpzb25ycGMiOiIyLjAifQ==
	AddonClient.detectFromURL('https://cinemeta.strem.io/stremioget/stremio/v1', function(err, res) {
		t.error(err, 'no error from detectFromURL')
		t.ok(res.addon, 'addon is ok')
		t.ok(res.addon.manifest, 'manifest is ok')
		t.deepEqual(res.addon.manifest.catalogs, ['series', 'movie'], 'catalogs is right')
		t.deepEqual(res.addon.manifest.resources, ['meta'], 'resources is right')
		res.addon.get('catalog', res.addon.manifest.catalogs[0], function(err, resp) {
			t.error(err, 'no error from catalog')
			t.ok(Array.isArray(resp), 'response is an array')
			t.ok(resp.length === 70, 'response is full length')

			res.addon.get('meta', resp[0].type, resp[0].imdb_id, function(err, resp) {
				t.error(err, 'no error from meta')

				t.ok(resp.fanart, 'has fanart')

				t.end()
			})
		})
	})
})

tape('detectFromURL: detect and use manifest.json URL', function(t) {
	// https://gateway.ipfs.io/ipfs/QmTQTixUrtf9E4fasjes5Jb1o956FF6xqSsXnwrc5GLKeB/manifest.json
	// https://gateway.ipfs.io/ipns/QmYRaTC2DqsgXaRUJzGFagLy725v1QyYwt66kvpifPosgj/manifest.json

	let addon
	AddonClient.detectFromURL('https://gateway.ipfs.io/ipfs/QmTQTixUrtf9E4fasjes5Jb1o956FF6xqSsXnwrc5GLKeB/manifest.json')
	.then(function(res) {
		t.ok(res.addon, 'addon is ok')
		t.ok(res.addon.manifest, 'manifest is ok')
		t.deepEqual(res.addon.manifest.catalogs, ['top'], 'catalogs is right')
		t.deepEqual(res.addon.manifest.resources, ['meta', 'stream'], 'resources is right')

		addon = res.addon

		return addon.get('catalog', 'top')
	})
	.then(function(resp) {
		t.ok(Array.isArray(resp), 'response is an array')

		return addon.get('meta', resp[0].type, resp[0].id)
	})
	.then(function(meta) {
		t.ok(meta.id, 'meta has id')

		return addon.get('stream', meta.type, meta.id)
	})
	.then(function(streams) {
		t.ok(Array.isArray(streams), 'streams is array')
		t.equal(streams.length, 2, 'streams is right length')
		t.end()
	})
	.catch(function(err) {
		t.error(err, 'no error')
		t.end()
	})
})

tape('detectFromURL: IPFS: detect and use manifest.json URL', function(t) {
	// ipfs://QmTQTixUrtf9E4fasjes5Jb1o956FF6xqSsXnwrc5GLKeB/manifest.json
	// ipns://QmYRaTC2DqsgXaRUJzGFagLy725v1QyYwt66kvpifPosgj/manifest.json

	let addon

	AddonClient.detectFromURL('ipfs://QmTQTixUrtf9E4fasjes5Jb1o956FF6xqSsXnwrc5GLKeB/manifest.json')
	.then(function(res) {
		t.ok(res.addon, 'addon is ok')
		t.ok(res.addon.manifest, 'manifest is ok')
		t.deepEqual(res.addon.manifest.catalogs, ['top'], 'catalogs is right')
		t.deepEqual(res.addon.manifest.resources, ['meta', 'stream'], 'resources is right')

		addon = res.addon

		return addon.get('catalog', 'top')
	})
	.then(function(resp) {
		t.ok(Array.isArray(resp), 'response is an array')
		return addon.get('meta', resp[0].type, resp[0].id)
	})
	.then(function(meta) {
		t.ok(meta.id, 'meta has id')

		return addon.get('stream', 'movie', parseInt(Math.random()*1000))
	})
	.then(function(stream) {
		console.log(stream)
		// IPFS addons need to be destroyed in order to allow the proc to exit
		addon.destroy(function() { t.end() })
	})
	.catch(function(err) {
		t.error(err, 'no error')

		// IPFS addons need to be destroyed in order to allow the proc to exit
		if (addon) addon.destroy(function() { t.end() })
		else t.end()
	})
})



// @TODO: detectFromURL: not recognized json response (ERR_RESP_UNRECOGNIZED)

// @TODO: detectFromURL: linked to a landing page with x-stremio-addon

// @TODO: detectFromURL: linked directly to manifest.json

// @TODO: detectFromURL: .get() in http transport: 404 and etc. handled accordingly

// @TODO: constructFromManifest: invalid transport

// @TODO: constructFromManifest: constructs successfully