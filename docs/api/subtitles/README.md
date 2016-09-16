### Subtitles

**Subtitles are provided in a [Subtitle Object](subtitle.object.md) which represents all possible subtitle tracks (in any number of languages) for a video stream.**

There are two ways to provide a [Subtitle Object](subtitle.object.md):

1. In the `subtitles` property of a [Stream](/docs/api/stream/stream.response.md). Recommended if you have an add-on that would provide both video streams and subtitles.
2. As a response from the `subtitles.find` method. Recommended if you are making a standalone add-on for subtitles.


#### `subtitles.find` Example

```javascript
var addon = new Stremio.Server({
	"subtitles.find": function(args, callback, user) {
		// expects an array of subtitle objects
	}
});
```

#### `subtitles.find` Request

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

See [Subtitle Object](subtitle.object.md) for response.

```javascript
// Subtitle Object
{
  id: "8e245d9679d31e12",  // mandatory, any unique string to identify this response
                           // can be the OpenSubtitles Hash of the file
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
