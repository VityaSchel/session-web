# Session Web

Experimental project running [Session messenger](https://getsession.org) in browser

Runs on Vite, WebContainers and my own [session-messenger-nodejs framework](https://github.com/VityaSchel/session-nodejs-bot)

## How does it work?

1. I'm using webcontainers.io to run Node.js VM inside browser
2. Since stackblitz does not allow github dependencies, selfhost it and download/write inside containers on start
3. Cmake doesn't work and I don't want to compile it under WASM and there is no reason because we can compile libsession-util itself and use ready binary instead of compiling inside container on each start
4. I have no idea how WASM works and experimenting with emscripten and cmake didn't work out so abandoning this project. 

if you knows how to build libsession-util under wasm and most importantly migrate nodejs native bindings from cmake/node-gyp to wasm to avoid rewriting session code, tell me: https://t.me/hlothdev