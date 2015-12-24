## What are Stremio add-ons 

**Stremio add-ons extend Stremio with content.**

That means either adding items to Discover or providing sources to stream content from.

Unlike regular software plugins, Stremio addons **do not run inside Stremio**, but instead are **accessed through HTTP over network**. You can think of them as **RSS on steroids**. Multiple addons can be activated, providing you more content, without any installation / security risks.

## How to create a Stremio add-on

Start by creating your repository from the Hello World add-on:
```bash
git --work-tree=my-addon clone http://github.com/Stremio/addon-helloworld
cd my-addon
git init
git add * 
git commit -a -m "first commit"
npm install
open stremio://localhost:7000/stremio/v1 & # Load this add-on in Stremio
PORT=7000 node index # Start the add-on server
```

**Stremio should open, and you should see "Example Addon" in Settings. Congrats! You've created your first add-on!**

After that, go to [Hello World tutorial](documentation/home.md#hello-world) to learn more about the process.

We recommend you take a look at the entire [protocol documentation](documentation/methods.md), to get to know exactly what an add-on can do.

When you've taken a look at the protocol and created your first add-on, it's time to move on with the development. You can test it with the [Stremio Desktop app](http://www.strem.io), but we recommend the open-source add-ons client: [stremio-addons-client](http://github.com/Stremio/stremio-addons-client).


## Protocol documentation

**A stremio add-on consists of a manifest and methods. The manifest contains basic information about it, such as name, version, author, etc.**

**The methods implement the actual functionality** - for example for loading Discover, we use `meta.find` method, and for loading streams once the user clicks Play, we use `stream.find`.

To learn all about the protocol, you can use the following documentation:

1. [Manifest](documentation/manifest.md)
2. [Methods](documentation/methods.md)

To see it used in the real world, we recommend you check the [open-source stremio client](http://github.com/Stremio/stremio-addons-client).


## Tutorials

[Hello World add-on](https://github.com/Ivshti/addon-helloworld)

## Open-source add-ons

[Guidebox add-on](http://github.com/Stremio/guidebox-stremio)

[Filmon.tv add-on](http://github.com/Stremio/filmon-stremio)
