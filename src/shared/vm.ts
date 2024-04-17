import { fileSystem } from '@/shared/files'
import { installArchive, installBinary } from '@/shared/vm-installation'
import { WebContainer } from '@webcontainer/api'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'

export async function bootVM({ terminalEl, onSetSrc }: { 
  terminalEl: HTMLDivElement 
  onSetSrc: (src: string) => void
}): Promise<WebContainer | false> {
  const fitAddon = new FitAddon()
  const terminal = new Terminal({
    convertEol: true,
  })
  terminal.loadAddon(fitAddon)
  terminal.open(terminalEl)
  fitAddon.fit()

  terminal.write('Booting up\n')
  const webcontainerInstance = await WebContainer.boot()
  await webcontainerInstance.mount(fileSystem)

  try {
    await setupEnvironment(webcontainerInstance, terminal)
  } catch(e) {
    if (e instanceof Error) {
      terminal.write(e.message)
      return false
    }
  }

  const installProcess = await webcontainerInstance.spawn('npm', ['install'])
  terminal.write('Installing main dependencies\n')

  installProcess.output.pipeTo(new WritableStream({
    write(data) {
      terminal.write(data)
    }
  }))

  const installExitCode = await installProcess.exit;
  if (installExitCode !== 0) {
    terminal.write('Unable to run npm install\n')
  }
  terminal.write('Code ' + installExitCode + '\n')

  // await webcontainerInstance.spawn('node', ['index.js']);
  // webcontainerInstance.on('server-ready', (port, url) => onSetSrc(url))

  const shellProcess = await webcontainerInstance.spawn('jsh', {
    terminal: {
      cols: terminal.cols,
      rows: terminal.rows,
    },
  })
  shellProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        terminal.write(data)
      },
    })
  )
  const input = shellProcess.input.getWriter()
  terminal.onData((data) => {
    input.write(data);
  })

  window.addEventListener('resize', () => {
    fitAddon.fit();
    shellProcess.resize({
      cols: terminal.cols,
      rows: terminal.rows,
    })
  })

  return webcontainerInstance
}

async function setupEnvironment(webcontainerInstance: WebContainer, terminal: Terminal) {
  await webcontainerInstance.fs.rename('package.json', 'package.json-default')
  await webcontainerInstance.fs.rename('package.json-unzip', 'package.json')

  const installProcess = await webcontainerInstance.spawn('npm', ['install'])
  const installExitCode = await installProcess.exit;
  if (installExitCode !== 0) {
    throw new Error('Unable to run npm install for unzipping libsession\n')
  }

  try {
    await installArchive({
      src: '/libsession_util_nodejs-v0.2.6.archive',
      name: 'libsession', filename: 'libsession_util_nodejs-v0.2.6',
      webcontainerInstance, terminal
  })
  } catch (e) {
    terminal.write('Error setting up libsession\n')
    throw e
  }

  try {
    await installArchive({
      src: '/curve25519-js-0.0.4.archive', 
      name: 'curve25519', filename: 'curve25519-js-0.0.4',
      webcontainerInstance, terminal
    })
    await webcontainerInstance.fs.rename('package', 'curve25519-js-0.0.4')
  } catch (e) {
    terminal.write('Error setting up curve25519js\n')
    throw e
  }

  try {
    await setupSessionFramework(webcontainerInstance, terminal)
  } catch (e) {
    terminal.write('Error setting up session-messenger-nodejs\n')
    throw e
  }

  // try {
  //   // await installBinary('/cmake-3.29.2-linux-x86_64.sh', 'cmake', webcontainerInstance, terminal)
  //   // await installArchive({ 
  //   //   src: '/cmake-3.29.2-linux-x86_64.archive', 
  //   //   name: 'cmake', filename: 'cmake-3.29.2-linux-x86_64',
  //   //   webcontainerInstance, terminal
  //   // })
  //   // const executables = await webcontainerInstance.fs.readdir('cmake-3.29.2-linux-x86_64/bin')
  //   // console.log(executables)
  //   // const renameProcess = await webcontainerInstance.spawn('mv', ['-R', 'cmake-3.29.2-linux-x86_64/bin', '/usr/bin/'])
  //   // await renameProcess.exit
  //   // await Promise.all(executables.map(async (executable) => {
  //   //   const chmodProcess = await webcontainerInstance.spawn('chmod', ['+x', `/usr/bin/${executable}`])
  //   //   await chmodProcess.exit
  //   // }))
  // } catch (e) {
  //   terminal.write('Error setting up session-messenger-nodejs\n')
  //   throw e
  // }

  await webcontainerInstance.fs.rm('package.json')
  await webcontainerInstance.fs.rename('package.json-default', 'package.json')
}

async function setupSessionFramework(webcontainerInstance: WebContainer, terminal: Terminal) {
  terminal.write('Downloading session-messenger-nodejs\n')
  const installProcess = await webcontainerInstance.spawn('npm', ['pack', 'session-messenger-nodejs'])
  const installExitCode = await installProcess.exit;
  if (installExitCode !== 0) {
    throw new Error('Unable to run npm pack for installing session-messenger-nodejs\n')
  }
  const untarProcess = await webcontainerInstance.spawn('node', ['untargz.js', 'session-messenger-nodejs-1.2.3.tgz'])
  untarProcess.output.pipeTo(new WritableStream({
    write(data) {
      terminal.write(data)
    }
  }))
  const untarExitCode = await untarProcess.exit;
  if (untarExitCode !== 0) {
    throw new Error('Unable to unarchive session-messenger-nodejs\n')
  }
  await webcontainerInstance.fs.rm('session-messenger-nodejs-1.2.3.tgz')
  await webcontainerInstance.fs.rename('package', 'session-messenger-nodejs-1.2.3')
  let sessionPackageJson = await webcontainerInstance.fs.readFile('session-messenger-nodejs-1.2.3/package.json', 'utf-8')
  sessionPackageJson = sessionPackageJson.replace(
    '"libsession_util_nodejs": "https://github.com/oxen-io/libsession-util-nodejs/releases/download/v0.2.6/libsession_util_nodejs-v0.2.6.tar.gz"', 
    '"libsession_util_nodejs": "file:./libsession_util_nodejs-v0.2.6"'
  )
  sessionPackageJson = sessionPackageJson.replace(
    '"curve25519-js": "https://github.com/oxen-io/curve25519-js"', 
    '"curve25519-js": "file:./curve25519-js-0.0.4"'
  )
  await webcontainerInstance.fs.writeFile('session-messenger-nodejs-1.2.3/package.json', sessionPackageJson)
  terminal.write('Extracted session-messenger-nodejs\n')
}

