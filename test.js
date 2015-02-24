
// TEMP
var s new Stremio();
s.addService("http://localhost:3009");
s.call("meta.get",{ id: 1 }, function(err, res){
	console.log(err,res);
})