### Publishing

All you need to do to publish your add-on is host it publically, and have the `endpoint` field in your manifest to point to the HTTP URL where the add-on is accessible (e.g. `http://nfxaddon.strem.io`).

Hosting the add-on is very easy, since Stremio add-ons are simply Node.js applications. You can see - [hosting your Add-on](/docs/tutorial/hosting.md) tutorial.

When you have a publically hosted add-on, and the `endpoint` field is properly set, the [`stremio-addons`](https://github.com/Stremio/stremio-addons) module will send the information about the add-on to our API, and it will evaluate if your add-on is accessible and if so, it will be shown in our [Add-on catalogue](https://addons.strem.io).