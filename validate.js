// simply console-log warnings in case of wrong args; aimed to aid development

module.exports = function(method, res) {
	if (method === "meta.find" || method === "stream.find") {
		if (! Array.isArray(res)) warning('result from '+method+' is not an array, but should be, but is ',res)
		else res.forEach(function(o) {
			if (method === "meta.find") validateMetadata(o)
			if (method === "stream.find") validateStream(o)
		})
	}

	if (method === "meta.get") {
		if (res) validateMetadata(res)
	}
}

function warning(msg) {
	console.log.apply(console, ['stremio-addons warning:'].concat(Array.prototype.slice.call(arguments)))
}

function validateMetadata(o) {
	if (! o) warning('empty metadata object') 
	else if (! o.id) warning('metadata object does not contain id')
	else if (! o.type) warning('metadata object with id:'+o.id+' does not contain type')
}

function validateStream(o) {
	if (! o) warning('empty stream object') 
	else if (! (o.url || o.yt_id || o.infoHash)) warning('stream object does not contain any stremable property')
}