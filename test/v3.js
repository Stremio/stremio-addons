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

// @TODO: detectFromURL: not recognized json response (ERR_RESP_UNRECOGNIZED)

// @TODO: detectFromURL: linked to a landing page with x-stremio-addon

// @TODO: detectFromURL: linked directly to manifest.json

// @TODO: constructFromManifest: invalid transport

// @TODO: constructFromManifest: constructs successfully