// fetch() for addresses a customer or visitor gave us (their website, a competitor,
// a thread they pasted). Refuses private/internal hosts — on Railway an open fetch
// could be aimed at *.railway.internal, 127.0.0.1 or 169.254.169.254 — and follows
// redirects by hand so every hop gets the same check. Fixed third-party APIs
// (Anthropic, Google, Stripe…) keep using plain fetch.
import { assertPublicHost, publicUrl } from "@/lib/connector/user"

const MAX_HOPS = 5

export async function safeFetch(input: string | URL, init: RequestInit = {}): Promise<Response> {
  const mode = init.redirect ?? "follow"
  let url = String(input)
  let { method = "GET", body } = init
  for (let hop = 0; ; hop++) {
    const u = publicUrl(url)
    if (!u) throw new Error("That address can't be reached from the internet.")
    await assertPublicHost(u.hostname)
    const res = await fetch(u, { ...init, method, body, redirect: "manual" })
    const location = res.headers.get("location")
    if (mode === "manual" || res.status < 300 || res.status > 399 || !location) return res
    await res.body?.cancel().catch(() => {})
    if (mode === "error") throw new TypeError("Redirect refused")
    if (hop >= MAX_HOPS) throw new TypeError("Too many redirects")
    url = new URL(location, u).toString()
    // Same as the fetch spec: 303 (and 301/302 after a POST) continue as a bodiless GET.
    if (res.status === 303 || ((res.status === 301 || res.status === 302) && method.toUpperCase() === "POST")) {
      method = "GET"
      body = undefined
    }
  }
}
