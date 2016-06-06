### Subtitles

Subtitles are being handled by the `subtitles.find` method.

```javascript
var addon = new Stremio.Server({
	"subtitles.find": function(args, callback, user) {
		// expects an array of subtitle objects
	}
});
```

#### Request

```javascript
{
    query: {
        itemHash: "tt23155 4 5",               // "4" = season, "5" = episode, usage of this param can vary, see docs
        videoHash: "8e245d9679d31e12",         // open subtitles hash of file
        videoSize: 652174912,                  // optional, file size in bytes
        videoName: "The.Wizard.of.Oz.1939.mp4" // optional, filename
    },
    supportsZip: true                          // can be "false" in some rare cases
}
```

See [Subtitle Request](subtitles.find.md) for Parameters.

#### Response

```javascript
{
  id: "8e245d9679d31e12",  // mandatory, any unique string to identify this response
                           // can be the Open Subtitle Hash of the file
  itemHash: "tt23155 4 5", // optional, same as the one from the request
  all: {
    [
	  {
        id: "string identifier",
        url: "url to srt file",
        lang: "language code in ISO 639-1"
      },
	  ...
    ]
}
```

See [Subtitle Object](subtitle.object.md) for Parameters.
