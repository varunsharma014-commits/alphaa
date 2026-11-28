// A small line + word diff for draft version history (client-safe, no dependency).
// Lines are matched first (LCS); each run of changed lines is then diffed word by word, so a
// one-word edit shows as one word, not a whole paragraph. Big inputs degrade to line level.

export type DiffOp = { t: "eq" | "add" | "del"; s: string }

const MAX_CELLS = 2_000_000

/** LCS over two token arrays → ops (equal / added / removed). */
function lcs(a: string[], b: string[]): DiffOp[] | null {
  // Trim the shared head and tail first: most edits are local.
  let head = 0
  while (head < a.length && head < b.length && a[head] === b[head]) head++
  let tail = 0
  while (tail < a.length - head && tail < b.length - head && a[a.length - 1 - tail] === b[b.length - 1 - tail]) tail++
  const A = a.slice(head, a.length - tail)
  const B = b.slice(head, b.length - tail)
  if ((A.length + 1) * (B.length + 1) > MAX_CELLS) return null
  const n = A.length, m = B.length
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const mid: DiffOp[] = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (A[i] === B[j]) { mid.push({ t: "eq", s: A[i] }); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) mid.push({ t: "del", s: A[i++] })
    else mid.push({ t: "add", s: B[j++] })
  }
  while (i < n) mid.push({ t: "del", s: A[i++] })
  while (j < m) mid.push({ t: "add", s: B[j++] })
  return [...a.slice(0, head).map((s) => ({ t: "eq" as const, s })), ...mid, ...a.slice(a.length - tail).map((s) => ({ t: "eq" as const, s }))]
}

/** Merge neighbours of the same kind. */
function merge(ops: DiffOp[]): DiffOp[] {
  const out: DiffOp[] = []
  for (const o of ops) {
    const last = out[out.length - 1]
    if (last && last.t === o.t) last.s += o.s
    else out.push({ ...o })
  }
  return out
}

const words = (s: string) => s.match(/\s+|[^\s]+/g) ?? []

/** Word-level diff of two texts (newlines kept), ops merged. `before` → `after`. */
export function diffText(before: string, after: string): DiffOp[] {
  const la = before.replace(/\r\n?/g, "\n").split(/(?<=\n)/)
  const lb = after.replace(/\r\n?/g, "\n").split(/(?<=\n)/)
  const lines = lcs(la, lb)
  if (!lines) return merge([{ t: "del", s: before }, { t: "add", s: after }])
  const out: DiffOp[] = []
  let del: string[] = [], add: string[] = []
  const flush = () => {
    if (del.length && add.length) {
      const w = lcs(words(del.join("")), words(add.join("")))
      if (w) out.push(...w)
      else out.push({ t: "del", s: del.join("") }, { t: "add", s: add.join("") })
    } else if (del.length) out.push({ t: "del", s: del.join("") })
    else if (add.length) out.push({ t: "add", s: add.join("") })
    del = []; add = []
  }
  for (const o of lines) {
    if (o.t === "eq") { flush(); out.push(o) }
    else if (o.t === "del") del.push(o.s)
    else add.push(o.s)
  }
  flush()
  return merge(out)
}

/** Words added / removed, for the history list ("+12 −3"). */
export function diffStats(ops: DiffOp[]): { added: number; removed: number } {
  const count = (s: string) => (s.match(/[^\s]+/g) ?? []).length
  return {
    added: ops.filter((o) => o.t === "add").reduce((n, o) => n + count(o.s), 0),
    removed: ops.filter((o) => o.t === "del").reduce((n, o) => n + count(o.s), 0),
  }
}
