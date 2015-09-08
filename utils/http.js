var http;
try { http = require("stream-http"); } catch(e) { http = require("http") };
module.exports = http;
