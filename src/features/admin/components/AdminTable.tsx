import type { ReactNode } from "react";

export type Column<Row> = {
  header: string;
  cell: (row: Row) => ReactNode;
  // Actions sit at the end of the row.
  align?: "start" | "end";
};

type AdminTableProps<Row> = {
  // Read by screen readers only; the page title shows it.
  caption: string;
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => number | string;
  empty: string;
};

// A list of records as a table. It scrolls sideways on small screens.
export function AdminTable<Row>({ caption, columns, rows, rowKey, empty }: AdminTableProps<Row>) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl bg-surface p-24 type-body-m text-muted ring-1 ring-line ring-inset">{empty}</p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl bg-surface ring-1 ring-line ring-inset">
      <table className="w-full border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-surface-2">
          <tr>
            {columns.map((column) => (
              <th
                className={`px-20 py-12 type-label-s whitespace-nowrap text-muted ${column.align === "end" ? "text-end" : "text-start"}`}
                key={column.header}
                scope="col"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-t border-line" key={rowKey(row)}>
              {columns.map((column) => (
                <td
                  className={`px-20 py-12 align-middle type-body-s text-ink-2 ${column.align === "end" ? "text-end" : "text-start"}`}
                  key={column.header}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
