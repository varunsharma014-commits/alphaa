// Small concurrency helpers for the personal-email crons.

/** Run `fn` over `items` with at most `limit` in flight. `fn` must not throw (callers catch). */
export async function mapPool<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

/** Serialises calls with a minimum gap between them (Resend: 2 requests/second). */
export function spacedQueue(gapMs: number) {
  let tail: Promise<unknown> = Promise.resolve()
  return <T>(fn: () => Promise<T>): Promise<T> => {
    const run = tail.then(fn)
    tail = run.catch(() => {}).then(() => new Promise((r) => setTimeout(r, gapMs)))
    return run
  }
}
