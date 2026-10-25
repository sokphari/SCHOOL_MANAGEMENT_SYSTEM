import type { ReactNode } from "react";

export interface AppTableColumn<T extends object> {
  key: string;
  title: string;
  render?: (row: T, index: number) => ReactNode;
}

interface AppTableProps<T extends object> {
  columns: AppTableColumn<T>[];
  data: T[];
}

export default function AppTable<T extends object>({ columns, data }: AppTableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-brand-soft/50 text-[11px] uppercase tracking-wide text-secondary">
            {columns.map((column) => <th key={column.key} className="whitespace-nowrap px-4 py-3 font-semibold sm:px-5">{column.title}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.length > 0 ? data.map((row, index) => (
            <tr key={getRowKey(row, index)} className="transition-colors hover:bg-brand-soft/30">
              {columns.map((column) => (
                <td key={column.key} className="px-4 py-3 align-middle text-secondary sm:px-5">
                  {column.render ? column.render(row, index) : getCellValue(row, column.key)}
                </td>
              ))}
            </tr>
          )) : <tr><td colSpan={columns.length} className="px-4 py-8 text-center text-secondary">No data found</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function getRowKey<T extends object>(row: T, index: number): string | number {
  const id = (row as { id?: unknown }).id;
  return typeof id === "string" || typeof id === "number" ? id : index;
}

function getCellValue<T extends object>(row: T, key: string): ReactNode {
  const value = (row as Record<string, unknown>)[key];
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return value;
  return "";
}
