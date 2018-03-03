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
		console.log(err, res)
		t.end()
	})
})

// @TODO: detectFromURL: not recognized json response (ERR_RESP_UNRECOGNIZED)

// @TODO: detectFromURL: linked to a landing page with x-stremio-addon

// @TODO: detectFromURL: linked directly to manifest.json

// @TODO: constructFromManifest: invalid transport

// @TODO: constructFromManifest: constructs successfully