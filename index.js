module.CENTRAL = "https://api9.strem.io";

module.exports.Client = require("./client");
module.exports.Client.RPC = require("./rpc"); // require rpc in index, so we can only require('stremio-addons/client') w/o an issue of requiring node-specific modules (http/https) in the browser
module.exports.Server = require("./server");
