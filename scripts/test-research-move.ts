// Research "#1 move": titles built from the category label never lead.
// Run: npx tsx scripts/test-research-move.ts
import assert from "node:assert/strict"
import { isLabelTitle } from "../src/lib/workspace/rivals"

const bt = "SaaS / Software Services"
const cases: [string, string | null, boolean][] = [
  ["SaaS / Software Services in Kanata", bt, true],
  ["Software Services in Kanata", bt, true],
  ["SaaS / Software Services", bt, true],
  ["Plumbing Services in Ottawa", "Plumbing", true],
  ["Local plumbing services in Ottawa", "Plumbing", true],
  ["How do AI search engines pick which software to recommend?", bt, false],
  ["How much does an emergency plumber cost in Ottawa?", "Plumbing", false],
  ["Drain cleaning services in Ottawa", "Plumbing", false],
  ["What is answer engine optimization", null, false],
  ["", bt, true],
]
let passed = 0
for (const [title, type, want] of cases) {
  assert.equal(isLabelTitle(title, type), want, `${title} (${type})`)
  passed++
}
console.log(`${passed} passed`)
