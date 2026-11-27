// Headless Chrome screenshot helper for brand/color (same approach as brand/social/posts/build.py:
// Chrome writes the PNG quickly but often lingers, so poll for the file and kill it).
import { spawn } from "child_process"
import { existsSync, statSync, rmSync, mkdtempSync } from "fs"
import { tmpdir } from "os"
import path from "path"

export const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

/** Screenshot a local HTML file (optionally with ?query) at w x h into out (PNG). */
export async function shot(file, w, h, out, query = "") {
  if (existsSync(out)) rmSync(out)
  const prof = mkdtempSync(path.join(tmpdir(), "alphaa-chrome-"))
  const url = "file://" + path.resolve(file) + (query ? `?${query}` : "")
  const p = spawn(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--user-data-dir=${prof}`,
    "--allow-file-access-from-files", "--force-device-scale-factor=1", `--window-size=${w},${h}`, `--screenshot=${path.resolve(out)}`, url],
    { stdio: "ignore", detached: true })
  let last = -1
  const t0 = Date.now()
  while (Date.now() - t0 < 40000) {
    if (p.exitCode !== null) break
    if (existsSync(out)) {
      const sz = statSync(out).size
      if (sz > 0 && sz === last) break
      last = sz
    }
    await new Promise((r) => setTimeout(r, 400))
  }
  try { process.kill(-p.pid, "SIGKILL") } catch {}
  rmSync(prof, { recursive: true, force: true })
  if (!existsSync(out)) throw new Error(`render failed: ${file}`)
  return out
}
