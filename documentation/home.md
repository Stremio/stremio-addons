## What are Stremio add-ons 

**Stremio add-ons extend Stremio with content.**

That means either adding items to Discover or providing sources to stream content from.

Unlike regular software plugins, Stremio addons **do not run inside Stremio**, but instead are **accessed through HTTP over network**. You can think of them as **RSS on steroids**. Multiple addons can be activated, providing you more content, without any installation / security risks.

## How to create a Stremio add-on

First, decide what kind of add-on do you want to create. Should it add items to the Discover catalogue (metadata add-on), or allow streaming of certain content (streaming add-on), or both.

After deciding these things, you can take a look at the [Hello World tutorial](documentation/home.md#hello-world) to get started.

Once you've created your first Stremio add-on, we recommend you take a look at the entire [protocol documentation](documentation/methods.md), to get to know exactly what an add-on can do.

When you've taken a look at the protocol and created your first add-on, it's time to move on with the development of your add-on. You can test it with the [Stremio Desktop app](http://www.strem.io), but we recommend the open-source add-ons client: [stremio-addons-client](http://github.com/Stremio/stremio-addons-client).


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
