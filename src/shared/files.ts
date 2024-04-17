import type { FileSystemTree } from '@webcontainer/api'

export const fileSystem: FileSystemTree = {
  'package.json': {
    file: {
      contents: `
        {
          "name": "session-web",
          "type": "module",
          "dependencies": {
            "session-messenger-nodejs": "file:./session-messenger-nodejs-1.2.3",
            "fastify": "4.26.2"
          }
        }`,
    },
  },
  'package.json-unzip': {
    file: {
      contents: `
        {
          "name": "session-web",
          "dependencies": {
            "tar": "7.0.1",
            "zlib": "1.0.5"
          }
        }
      `
    }
  },
  'untargz.js': {
    file: {
      contents: `
        const fs = require('fs')
        const tar = require('tar')
        const zlib = require('zlib')
        
        const file = process.argv[2]
        const dest = './'
        
        fs.createReadStream(file)
          .pipe(zlib.createGunzip())
          .pipe(tar.x({ C: dest }))
      `,
    },
  },
  'index.js': {
    file: {
      contents: `
        import { initializeSession } from 'session-messenger-nodejs'

        async function main() {
          await initializeSession()
          const result = await createIdentity('test from webcontainers')
          console.log('Created identity', result)
        }

        main()
      `,
    },
  }
}