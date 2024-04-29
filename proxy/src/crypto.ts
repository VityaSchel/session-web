export const sha256 = (s: string) => {
  return new Bun.CryptoHasher('sha256').update(s).digest('base64')
}