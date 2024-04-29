import { fetchSnodesList } from '@/shared/api/snodes'

export function HomePage() {
  const handleFetchSnodes = async () => {
    console.log('fetching snodes', (await fetchSnodesList()).length)
  }

  return (
    <div>
      <button onClick={handleFetchSnodes}>test</button>
    </div>
  )
}
