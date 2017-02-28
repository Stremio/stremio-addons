### Publishing

All you need to do to publish your add-on is host it publically, and have the **`endpoint`** field in your manifest to point to the HTTP URL where the add-on is accessible (e.g. `http://twitch.strem.io`).

Hosting the add-on is very easy, since Stremio add-ons are simply Node.js applications. You can see - [hosting your Add-on](/docs/tutorial/hosting.md) tutorial.

When you have a publically hosted add-on, and the `endpoint` field is properly set, the [`stremio-addons`](https://github.com/Stremio/stremio-addons) module will send the information about the add-on to our API, and it will automatically evaluate if your add-on is accessible and if so, it will be shown in our [Add-on catalogue](https://addons.strem.io). We do not moderate the listing on (https://addons.strem.io), the add-on should show automatically once `endpoint` is pointed to a valid endpoint.

Please note that in order for the add-on to work on Android and iOS, it needs to support the `https` protocol. It's not necessary that you will use `https`. However, the mobile application will always try to access it through `https`.
