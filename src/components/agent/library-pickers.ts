"use client"
// The two file pickers for "Your brand library", run in the owner's browser:
//   Google Picker  (apis.google.com/js/api.js → gapi.load("picker")), with a drive.file access
//                  token minted by /api/library/drive/token; setAppId(project number) grants the
//                  picked files to our app, so the server can read them later.
//   Dropbox Chooser (dropbox.com/static/api/2/dropins.js), linkType "preview" = a shared link
//                  we keep; we turn it into a download only when we read the file.
// Both resolve to the picked files (empty when the owner closes the picker).
import type { PickedFile } from "@/lib/library/types"
import { DROPBOX_EXTENSIONS, MAX_PICK, PICK_MIMES } from "@/lib/library/types"

type G = {
  load: (lib: string, cb: () => void) => void
}
type PickerNS = {
  PickerBuilder: new () => PickerBuilder
  DocsView: new (viewId?: unknown) => DocsView
  ViewId: Record<string, unknown>
  Feature: Record<string, unknown>
  DocsViewMode: Record<string, unknown>
  Action: Record<string, string>
  Response: Record<string, string>
}
type DocsView = { setMimeTypes: (m: string) => DocsView; setIncludeFolders: (b: boolean) => DocsView; setMode: (m: unknown) => DocsView }
type PickerBuilder = {
  addView: (v: unknown) => PickerBuilder
  enableFeature: (f: unknown) => PickerBuilder
  setOAuthToken: (t: string) => PickerBuilder
  setDeveloperKey: (k: string) => PickerBuilder
  setAppId: (id: string) => PickerBuilder
  setOrigin: (o: string) => PickerBuilder
  setMaxItems: (n: number) => PickerBuilder
  setTitle: (t: string) => PickerBuilder
  setCallback: (cb: (data: Record<string, unknown>) => void) => PickerBuilder
  build: () => { setVisible: (v: boolean) => void }
}
type DropboxNS = { choose: (o: Record<string, unknown>) => void; isBrowserSupported?: () => boolean }
type W = Window & { gapi?: G; google?: { picker?: PickerNS }; Dropbox?: DropboxNS }

const loaded = new Map<string, Promise<void>>()
function loadScript(src: string, attrs: Record<string, string> = {}): Promise<void> {
  if (loaded.has(src)) return loaded.get(src)!
  const p = new Promise<void>((resolve, reject) => {
    const el = document.createElement("script")
    el.src = src
    el.async = true
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
    el.onload = () => resolve()
    el.onerror = () => { loaded.delete(src); reject(new Error("The picker didn’t load. Check your connection and try again.")) }
    document.head.appendChild(el)
  })
  loaded.set(src, p)
  return p
}

/** Load a picker's script ahead of the tap (the Dropbox pop-up must open right on the click). */
export function preloadPicker(source: "drive" | "dropbox", key?: string): void {
  if (typeof window === "undefined") return
  if (source === "drive") void loadScript("https://apis.google.com/js/api.js").catch(() => null)
  else if (key) void loadScript("https://www.dropbox.com/static/api/2/dropins.js", { id: "dropboxjs", "data-app-key": key }).catch(() => null)
}

export class NeedsConnect extends Error {
  constructor(public href: string) { super("Connect Google Drive first.") }
}

export async function pickFromDrive(): Promise<PickedFile[]> {
  const w = window as W
  const [cfg] = await Promise.all([
    fetch("/api/library/drive/token", { cache: "no-store" }).then(async (r) => ({ ok: r.ok, data: (await r.json().catch(() => ({}))) as { token?: string; apiKey?: string; appId?: string; error?: string; connect?: string } })),
    loadScript("https://apis.google.com/js/api.js"),
  ])
  if (!cfg.ok || !cfg.data.token) {
    if (cfg.data.connect) throw new NeedsConnect(cfg.data.connect)
    throw new Error(cfg.data.error ?? "Google Drive didn’t answer. Try again.")
  }
  await new Promise<void>((resolve) => w.gapi!.load("picker", () => resolve()))
  const P = w.google!.picker!
  // drive.file can't see thumbnails before a file is picked, so Google suggests the list view.
  const view = new P.DocsView(P.ViewId.DOCS).setMimeTypes(PICK_MIMES.join(",")).setIncludeFolders(true).setMode(P.DocsViewMode.LIST)
  return new Promise<PickedFile[]>((resolve) => {
    const picker = new P.PickerBuilder()
      .addView(view)
      .enableFeature(P.Feature.MULTISELECT_ENABLED)
      .setMaxItems(MAX_PICK)
      .setOAuthToken(cfg.data.token!)
      .setDeveloperKey(cfg.data.apiKey!)
      .setAppId(cfg.data.appId!)
      .setOrigin(window.location.origin)
      .setTitle("Pick your brand book, photos or videos")
      .setCallback((data) => {
        const action = data[P.Response.ACTION]
        if (action === P.Action.CANCEL) return resolve([])
        if (action !== P.Action.PICKED) return
        const docs = (data[P.Response.DOCUMENTS] ?? []) as Record<string, unknown>[]
        resolve(docs.map((d) => ({
          id: String(d.id ?? ""),
          name: String(d.name ?? "Untitled"),
          mimeType: d.mimeType ? String(d.mimeType) : undefined,
          sizeBytes: typeof d.sizeBytes === "number" ? d.sizeBytes : Number(d.sizeBytes) || undefined,
          resourceKey: d.resourceKey ? String(d.resourceKey) : undefined,
          durationSec: typeof d.duration === "number" ? d.duration : undefined,
        })).filter((f) => f.id))
      })
      .build()
    picker.setVisible(true)
  })
}

export async function pickFromDropbox(key: string): Promise<PickedFile[]> {
  const w = window as W
  await loadScript("https://www.dropbox.com/static/api/2/dropins.js", { id: "dropboxjs", "data-app-key": key })
  if (!w.Dropbox) throw new Error("Dropbox didn’t load. Try again.")
  if (w.Dropbox.isBrowserSupported && !w.Dropbox.isBrowserSupported()) throw new Error("Dropbox doesn’t support this browser. Try Chrome or Safari.")
  return new Promise<PickedFile[]>((resolve) => {
    w.Dropbox!.choose({
      linkType: "preview",
      multiselect: true,
      folderselect: false,
      extensions: DROPBOX_EXTENSIONS,
      success: (files: { id?: string; name: string; link: string; bytes?: number; thumbnailLink?: string; isDir?: boolean }[]) =>
        resolve(files.filter((f) => !f.isDir).slice(0, MAX_PICK).map((f) => ({ id: f.id, name: f.name, link: f.link, sizeBytes: f.bytes, thumbnailLink: f.thumbnailLink }))),
      cancel: () => resolve([]),
    })
  })
}
