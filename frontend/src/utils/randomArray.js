
export function randomArray(items) {
    return [...items].sort(() => Math.random() - 0.5);
}