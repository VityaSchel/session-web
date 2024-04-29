export async function getNowWithNetworkOffset(): Promise<number> {
  const time = await fetch('http://localhost:3000/network_time')
    .then(req => req.json() as Promise<{ value: number }>)
  return time.value
}