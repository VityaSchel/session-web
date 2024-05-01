export async function getNowWithNetworkOffset(): Promise<number> {
  const time = await fetch(import.meta.env.VITE_BACKEND_URL + '/network_time')
    .then(req => req.json() as Promise<{ value: number }>)
  return time.value
}