const KEY = "urpiece-viewed";
const MAX = 12;

/** Product ids the visitor looked at, newest first (kept only in their own browser). */
export function getViewed(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function addViewed(id: string) {
  try {
    const next = [id, ...getViewed().filter((x) => x !== id)].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage blocked: suggestions just fall back to popular items */
  }
}
