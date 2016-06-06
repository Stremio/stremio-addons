### Subtitles Find

``query`` - **required** - Object, query to retrieve the subtitles

``query.itemHash`` - **required** - identifies the current item based on metadata

For movies, this is only the IMDB ID, e.g. ``"tt0063350"``.

For series, this is the IMDB, and season/episode numbers, split with interval - e.g. ``"tt1748166 1 1"`` for season 1, episode 1 of [_Pioneer One_](https://en.wikipedia.org/wiki/Pioneer_One)

For channels, this is the YouTube ID of the channel and the YouTube ID of the video, split with an interval. For example, ``"UC3gsgELlsob7AFi-mHOqNkg 9bZkp7q19f0"``.

``query.videoHash`` - _optional_ - String -highly recommended to use - this is the hash of the video, generated with the [_OpenSubtitles algorithm_](https://trac.opensubtitles.org/projects/opensubtitles/wiki/HashSourceCodes)

``query.videoSize`` - _optional_ - Number - byte size of the video

``query.videoName`` - _optional_ - filename of the original video

``supportsZip`` - _optional_ - boolean, true if your client supports ``.zip`` files for subtitles; in this case, the client should use the first ``.srt`` file inside the provided ``.zip`` file
