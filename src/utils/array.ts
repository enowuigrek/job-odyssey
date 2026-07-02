export function updateAt<T>(arr: T[], i: number, val: T): T[] {
  return arr.map((x, idx) => (idx === i ? val : x));
}

export function removeAt<T>(arr: T[], i: number): T[] {
  return arr.filter((_, idx) => idx !== i);
}

export function moveAt<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
