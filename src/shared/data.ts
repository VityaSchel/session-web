export type StorageItem = {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
};


export async function getItemById(key: string): Promise<StorageItem | undefined> {
  return { id: key, value: window.localStorage.getItem(key) }
}