let networkOffset: number | undefined
export async function getNowWithNetworkOffset(): Promise<number> {
  if (networkOffset === undefined) {
    const time = await fetch(import.meta.env.VITE_BACKEND_URL + '/network_time')
      .then(req => req.json() as Promise<{ value: number }>)
    networkOffset = time.value
  }
  return networkOffset
}