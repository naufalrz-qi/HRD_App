"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  /** Nilai untuk render sel. */
  render: (row: T) => React.ReactNode;
  /** Nilai untuk sort & search (default: gunakan render bila string). */
  sortValue?: (row: T) => string | number;
  searchValue?: (row: T) => string;
  className?: string;
}

/** Pengganti simple-datatables: search + sort + paginate, label Indonesia. */
export function DataTable<T>({
  columns,
  rows,
  perPage = 10,
  emptyText = "Tidak ada data ditemukan",
}: {
  columns: Column<T>[];
  rows: T[];
  perPage?: number;
  emptyText?: string;
}) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      columns.some((c) => {
        const v = c.searchValue ? c.searchValue(row) : "";
        return v.toLowerCase().includes(q);
      })
    );
  }, [rows, query, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return filtered;
    const arr = [...filtered].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / perPage));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * perPage;
  const pageRows = sorted.slice(start, start + perPage);

  const toggleSort = (col: Column<T>) => {
    if (!col.sortValue) return;
    if (sortKey === col.key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-end">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Cari data..."
            className="w-56 rounded-md border border-card-border bg-card py-2 pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-card-border text-xs uppercase tracking-wide text-text-muted">
              {columns.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c)}
                  className={`px-3 py-3 font-semibold ${c.sortValue ? "cursor-pointer select-none" : ""} ${c.className ?? ""}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {sortKey === c.key &&
                      (sortDir === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-text-muted">
                  {emptyText}
                </td>
              </tr>
            ) : (
              pageRows.map((row, i) => (
                <tr key={i} className="border-b border-card-border/60 last:border-0 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]">
                  {columns.map((c) => (
                    <td key={c.key} className={`px-3 py-3 align-top text-text-main ${c.className ?? ""}`}>
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
        <span>
          Menampilkan {sorted.length === 0 ? 0 : start + 1} sampai {Math.min(start + perPage, sorted.length)} dari total{" "}
          {sorted.length} data
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="rounded-md border border-card-border px-2.5 py-1 disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span className="px-2">
            {safePage} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="rounded-md border border-card-border px-2.5 py-1 disabled:opacity-40"
          >
            Berikutnya
          </button>
        </div>
      </div>
    </div>
  );
}
