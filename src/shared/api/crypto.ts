export const concatUInt8Array = (...args: Array<Uint8Array>): Uint8Array => {
  const totalLength = args.reduce((acc, current) => acc + current.length, 0)

  const concatted = new Uint8Array(totalLength)
  let currentIndex = 0
  args.forEach(arr => {
    concatted.set(arr, currentIndex)
    currentIndex += arr.length
  })

  return concatted
}