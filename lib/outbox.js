/**
 * Field actions taken with no network. Kept in localStorage so they survive a
 * reload or a dead battery swap, then sent in order when the phone is back online.
 */
const KEY = "himsetu.outbox";

export function readOutbox() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function writeOutbox(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export function pushOutbox(item) {
  const items = [...readOutbox(), item];
  writeOutbox(items);
  return items;
}
