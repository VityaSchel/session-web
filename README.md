# Session Web

Experimental project running [Session messenger](https://getsession.org) in browser.

**This is rather a challenge for me, rather than usable client. This website is unofficial implementation of Session messenger protocol which is not intended to be used with your actual accounts.**

Top 3 reasons why you should not input anything confidential and instead use official client:

1. I didn't care about best practices when writing this code, it does not use ANY security measures implemented in official client, it does not prevent you from any kind of malicious attack, for example MITM. Backend requests to snodes aren't onion routed. SSL certificate pinning is not implemented (bun does not support this yet)
2. I host my own proxy server, since official Session SeedNodesApi endpoints does not return CORS headers, thus blocking direct fetch. So even though all the data is encrypted during transmission, you have to take my word I'm not logging or modifying it on this proxy server
3. This client does not support any features and is not maintained for security vulnerabilities found in code or dependencies

Runs on Vite. Mostly written from scratch using [Session Desktop client](https://github.com/oxen-io/session-desktop)