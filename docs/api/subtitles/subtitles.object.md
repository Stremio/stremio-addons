### Subtitle Object

``id`` - **required** - identifier of the subtitles object - could be any string - serves to identify the set of subtitles for a specific video; example of this is the OpenSubtitles MovieHash - if taking subtitles from there, the MovieHash can be used as an ``id``

``itemHash`` - _optional_  - metadata item hash, which is defined as a combination of the [``Meta Element``](/docs/api/meta/meta.element.md)'s ``id`` followed by ``season`` / ``episode`` or ``video_id``, separated by a white space; example of this is ``tt0898266 9 17``

``all`` - **required** - all of the subtitle variants for this ``id`` - array of

```javascript
{
    id: "string identifier",
    url: "url to srt file",
    lang: "language code in ISO 639-1"
}
```


``exclusive`` - _optional_ - set to `true` if you don't want Stremio to try to find more subtitles by `subtitles.find`. Applicable when returning a Subtitle Object with your `stream.find`.
