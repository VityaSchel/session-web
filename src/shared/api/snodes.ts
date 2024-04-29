export async function fetchSnodesList() {
  const snodes = await fetch('http://localhost:3000/snodes')
    .then(res => res.json())
  return snodes.nodes
}