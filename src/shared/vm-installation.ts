import { WebContainer } from "@webcontainer/api"
import { Terminal } from "xterm"

export async function installArchive({ src, name, filename, webcontainerInstance, terminal }: {
  src: string
  name: string
  filename: string
  terminal: Terminal
  webcontainerInstance: WebContainer
}) {
  terminal.write(`Downloading ${name}\n`)
  const source = await fetch(src)
    .then(res => res.arrayBuffer())
  terminal.write(`Uploading ${name} (${source.byteLength} bytes)\n`)
  await webcontainerInstance.fs.writeFile(filename, new Uint8Array(source))
  terminal.write(`Extracting ${name}\n`)
  const untarProcess = await webcontainerInstance.spawn('node', ['untargz.js', filename])
  untarProcess.output.pipeTo(new WritableStream({
    write(data) {
      terminal.write(data)
    }
  }))
  const untarExitCode = await untarProcess.exit;
  if (untarExitCode !== 0) {
    throw new Error(`Unable to unarchive ${name}\n`)
  }
  terminal.write(`Extracted ${name}\n`)
  await webcontainerInstance.fs.rm(filename)
}

export async function installBinary(binarySrc: string, binaryName: string, webcontainerInstance: WebContainer, terminal: Terminal) {
  terminal.write(`Downloading ${binaryName}\n`)
  const binarySrcCode = await fetch(binarySrc)
    .then(res => res.arrayBuffer())
  terminal.write(`Uploading ${binaryName} (${binarySrcCode.byteLength} bytes)\n`)
  await webcontainerInstance.fs.writeFile(binaryName, new Uint8Array(binarySrcCode))
  const renameProcess = await webcontainerInstance.spawn('mv', [binaryName, `/usr/bin/${binaryName}`])
  await renameProcess.exit
  const chmodProcess = await webcontainerInstance.spawn('chmod', ['+x', `/usr/bin/${binaryName}`])
  await chmodProcess.exit
}