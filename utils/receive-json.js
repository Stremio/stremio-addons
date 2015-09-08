module.exports = function(resp, callback) {
	var body = [];
	resp.on("data", function(b) { body.push(b) });
	resp.on("end", function() {
		try { body = JSON.parse(Buffer.concat(body).toString()) } catch(e) { return callback(e) }
		callback(null, body);
	});
}