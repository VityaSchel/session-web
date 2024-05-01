import React from 'react'

export const SodiumLoader = React.lazy(async () => {
  const sodium = await import('libsodium-wrappers-sumo')
  await sodium.ready

  return {
    default: ({ children }: React.PropsWithChildren) => children
  }
})