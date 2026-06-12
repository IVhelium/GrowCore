export function randomProducts(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function randomUsers(users) {
  return [...users].sort(() => Math.random() - 0.5);
}
