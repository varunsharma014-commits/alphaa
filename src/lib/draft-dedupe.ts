// Draft dedupe: the same piece must never show up twice in the briefing or a queue.
// Client-safe (no db imports).

/** Lowercased letters/digits only, first `n` characters: two drafts with this key are the same piece. */
export function draftKey(text: string | null | undefined, n = 120): string {
  return (text ?? "").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim().slice(0, n)
}

/** Keep the first item per key (callers pass newest first). Empty keys are always kept. */
export function uniqueBy<T>(items: T[], key: (t: T) => string): T[] {
  const seen = new Set<string>()
  return items.filter((t) => {
    const k = key(t)
    if (!k) return true
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** One in-flight run per key in this process: a second caller gets the first caller's promise. */
const inflight = new Map<string, Promise<unknown>>()
export function once<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const running = inflight.get(key) as Promise<T> | undefined
  if (running) return running
  const p = fn().finally(() => inflight.delete(key))
  inflight.set(key, p)
  return p
}
