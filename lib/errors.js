module.exports = {
	// Detection errors (AddonClient.detectFromURL)
	ERR_URL: { code: 0, message: 'Invalid URL' },
	ERR_PROTOCOL: { code: 1, message: 'Invalid URL protocol' },
	ERR_UNRECOGNIZED: { code: 2, message: 'Not recognized as an add-on or a repository' },

	ERR_NO_TRANSPORT: { code: 3, message: 'No valid manifest.transport' },
	ERR_BAD_HTTP: { code: 4, message: 'Invalid HTTP status code' },
	ERR_RESP_UNRECOGNIZED: { code: 5, message: 'Response not recognized as an add-on or a repository' },

	ERR_JSON_EXPECTED: { code: 6, message: 'Response is not JSON' },

	ERR_NOT_FOUND: { code: 7, message: 'Not found' },
	ERR_UNSUPPORTED_RESOURCE: { code: 8, message: 'Unsupported resource' },

	ERR_MANIFEST_INVALID: { code: 9, message: 'Invalid manifest' },

	ERR_MANIFEST_CALL_FIRST: { code: 10, message: '.manifest must be called first' },

}