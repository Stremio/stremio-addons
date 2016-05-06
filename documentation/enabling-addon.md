#### Enabling an add-on in Stremio

To enable the add-on in Stremio, you can do one of two things:

1. Open the add-on's endpoint in your browser (e.g. http://localhost:5005) and click on "activate in Stremio"
2. Start Stremio (Stremio.exe or Contents/MacOS/Electron) with ``--addon=http://localhost:5005`` argument

In both cases, you should make sure the add-on is activated in Stremio's Settings panel.

You should check out ``./test/addon-protocol`` to see how an add-on should respond to methods, and run it to check if it's up to standards. 

**NOTE**

You can also use the [open-source add-ons client](https://github.com/Stremio/stremio-addons-client) to test your add-on, **which is heavily encouraged**, at least initially, because it's logic is simpler and open-source
