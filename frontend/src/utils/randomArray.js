export function randomProducts(items) {
  // Returns a shuffled copy of products without changing the original array.
  return [...items].sort(() => Math.random() - 0.5);
}

export function randomUsers(users) {
  // Returns a shuffled copy of users without changing the original array.
  return [...users].sort(() => Math.random() - 0.5);
}
