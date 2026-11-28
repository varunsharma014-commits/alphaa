"use client"

import { useMemo, useState, type ReactNode } from "react"
import { Menu, type MenuItem } from "./overlay"

export type Column<R> = {
  key: string
  label: ReactNode
  /** Cell content; default = String(value(row)). */
  render?: (r: R) => ReactNode
  /** Raw value for sorting (and the default cell). */
  value?: (r: R) => string | number | null | undefined
  /** Right-aligned tabular numbers. */
  num?: boolean
  sortable?: boolean
  width?: number | string
  /** Leave this column out of the phone cards. */
  hideOnCards?: boolean
}

// A real table: sortable columns, sticky header (and first column with `stickyFirst`), numbers
// right-aligned, an optional ⋯ menu per row, and on phones each row becomes a small card.
export function DataTable<R>({ columns, rows, rowKey, onRowClick, rowMenu, defaultSort, stickyFirst = false, cards = true, card = true, maxHeight, empty, label }: {
  columns: Column<R>[]
  rows: R[]
  rowKey: (r: R) => string
  onRowClick?: (r: R) => void
  rowMenu?: (r: R) => MenuItem[]
  defaultSort?: { key: string; dir: "asc" | "desc" }
  stickyFirst?: boolean
  /** Phone card fallback (default on). */
  cards?: boolean
  /** Wrap in a soft card (default on). */
  card?: boolean
  /** Scroll inside the table past this height (the header stays put). */
  maxHeight?: number
  /** Shown instead of the table when there are no rows. */
  empty?: ReactNode
  /** Accessible table name. */
  label: string
}) {
  const [sort, setSort] = useState(defaultSort ?? null)
  const sorted = useMemo(() => {
    if (!sort) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.value) return rows
    const v = col.value
    return [...rows].sort((a, b) => {
      const x = v(a), y = v(b)
      if (x == null && y == null) return 0
      if (x == null) return 1
      if (y == null) return -1
      const c = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" })
      return sort.dir === "asc" ? c : -c
    })
  }, [rows, sort, columns])
  if (!rows.length && empty) return <>{empty}</>
  const cell = (c: Column<R>, r: R) => (c.render ? c.render(r) : c.value ? (c.value(r) ?? "") : "")
  const toggle = (k: string) => setSort((s) => (s?.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: columns.find((c) => c.key === k)?.num ? "desc" : "asc" }))
  return (
    <>
      <div className={`xd-tw${card ? " card" : ""}${cards ? " cards" : ""}`} style={maxHeight ? { maxHeight } : undefined}>
        <table className={`xd-t${stickyFirst ? " sticky1" : ""}`} aria-label={label}>
          <thead>
            <tr>
              {columns.map((c) => {
                const on = sort?.key === c.key
                return (
                  <th key={c.key} className={c.num ? "num" : undefined} style={c.width ? { width: c.width } : undefined} aria-sort={on ? (sort!.dir === "asc" ? "ascending" : "descending") : undefined} scope="col">
                    {c.sortable && c.value ? (
                      <button type="button" className={`xd-sort${on ? " on" : ""}`} onClick={() => toggle(c.key)}>
                        {c.label}<span className="ar" aria-hidden="true">{on ? (sort!.dir === "asc" ? "▲" : "▼") : "▲▼"}</span>
                      </button>
                    ) : c.label}
                  </th>
                )
              })}
              {rowMenu && <th style={{ width: 44 }}><span className="sr-only">Actions</span></th>}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={rowKey(r)} className={onRowClick ? "click" : undefined} onClick={onRowClick ? (e) => { if ((e.target as HTMLElement).closest("button,a")) return; onRowClick(r) } : undefined}>
                {columns.map((c) => <td key={c.key} className={c.num ? "num" : undefined}>{cell(c, r)}</td>)}
                {rowMenu && <td style={{ padding: "4px 8px" }}><Menu items={rowMenu(r)} label="Row actions" /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {cards && (
        <div className="xd-tcards" role="list" aria-label={label}>
          {sorted.map((r) => {
            const [first, ...rest] = columns
            return (
              <div key={rowKey(r)} className="xd-tcard" role="listitem" onClick={onRowClick ? (e) => { if ((e.target as HTMLElement).closest("button,a")) return; onRowClick(r) } : undefined} style={onRowClick ? { cursor: "pointer" } : undefined}>
                <div className="xd-tcard__t"><span style={{ minWidth: 0 }}>{cell(first, r)}</span>{rowMenu && <Menu items={rowMenu(r)} label="Row actions" />}</div>
                <dl>
                  {rest.filter((c) => !c.hideOnCards).map((c) => (
                    <div key={c.key} style={{ display: "contents" }}><dt>{c.label}</dt><dd>{cell(c, r)}</dd></div>
                  ))}
                </dl>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
