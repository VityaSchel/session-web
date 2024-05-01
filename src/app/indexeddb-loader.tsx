import React from 'react'
import { indexedDB as fakeIndexedDB, IDBKeyRange as fakeIDBKeyRange } from 'fake-indexeddb'
import Dexie from 'dexie'

export const IndexedDbLoader = React.lazy(async () => {
  const indexedDbAvailable = await new Promise(resolve => {
    const request = window.indexedDB.open('test')
    request.onerror = () => resolve(false)
    request.onsuccess = () => resolve(true)
  })

  if (!indexedDbAvailable) {
    Dexie.dependencies.indexedDB = fakeIndexedDB
    Dexie.dependencies.IDBKeyRange = fakeIDBKeyRange
    console.warn('Activated indexeddb shim')
    window.shimmedIndexedDb = true
  } else {
    window.shimmedIndexedDb = false
  }

  return {
    default: ({ children }: React.PropsWithChildren) => children
  }
})