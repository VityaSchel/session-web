# [Session Web](https://session-web.pages.dev)

Experimental project running [Session messenger](https://getsession.org) in browser.

![Screenshot](https://github.com/VityaSchel/session-web/assets/59040542/3d8a1744-efa5-4cbc-8c60-5d06dfcc77c3)

Visit Session Web: [session-web.pages.dev](https://session-web.pages.dev)

Works in Tor! 99% client-side (still requires proxy to swarms though). All encryption and private keys never leave browser.

**This is rather a technical challenge for me, rather than a stable client**

- [X] Receiving messages
- [X] Sending messages
  - [ ] Attachments support
- [ ] Clearing network
- [ ] Conversations pinning
- [ ] Closed groups
- [ ] Open groups (communities)
- [ ] Blocked list
- [ ] Profile editing
- [ ] Searching conversations
- [ ] Searching in conversations
- [ ] Optimizations
  - [ ] Partial conversations loading
- [X] Multiaccount
- [X] Localization
  - [X] English
  - [X] Russian
  - [ ] Option to change UI language
- [ ] PWA
  - [ ] Offline support
  - [ ] Updates
- [ ] Push notifications
  - [ ] Notifications settings
- [ ] Calls
- [ ] Custom proxy server support
- [ ] Direct nodes connection support
  - [ ] Onion routing

## How it works?

All your confidential data (private keys, decrypted messages etc) never left your device. We need a proxy server though for 2 reasons:
1. Every node has its own self-signed SSL certificate and browsers reject connection to these, unless they are added to system level
2. Nodes do not send CORS headers, which prevent reading responses

Proxy server is only used to route your encrypted JSON_RPC requests to chosen node.

Source code of proxy server is at [proxy](./proxy) directory and is written in Bun.

Be aware that I didn't care about best practices when writing this code, it does not use any security measures implemented in official clients, it does not prevent you from any kind of malicious attack, for example MITM. Backend requests to nodes aren't onion routed. SSL certificate pinning is not implemented (bun does not support this yet). This client does not support any cool features and is not maintained for security vulnerabilities found in code or dependencies.

Runs on Vite. Backend is mostly written from scratch using parts of code from [Session Desktop client](https://github.com/oxen-io/session-desktop)