"use client";

import React, { useMemo, useState } from "react";

/**
 * Dynamic, type-safe DataTable for React + Tailwind CSS
 * ----------------------------------------------------
 * - Infers columns automatically from your data's TypeScript interface (keys of T)
 * - Or: pass a columns array to customize headers, order, and cell rendering
 * - Click a header to sort (asc/desc). Smart compare for strings, numbers & dates
 * - Minimal Tailwind styling; easy to extend
 *
 * Example usage is at the bottom (default export <Demo />) so you can preview.
 * Copy the <DataTable /> component for your own project.
 */

// Helpers
function isDateLike(value: unknown): boolean {
    if (value instanceof Date) return true;
    if (typeof value === "string") {
        const d = new Date(value);
        return !isNaN(d.getTime());
    }
    return false;
}

function compareValues(a: unknown, b: unknown): number {
    // Handle undefined/null consistently
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    // Date-like
    if (isDateLike(a) && isDateLike(b)) {
        const da = a instanceof Date ? a : new Date(a as any);
        const db = b instanceof Date ? b : new Date(b as any);
        return da.getTime() - db.getTime();
    }

    // Numbers
    if (typeof a === "number" && typeof b === "number") return a - b;

    // Booleans
    if (typeof a === "boolean" && typeof b === "boolean") return (a === b) ? 0 : a ? 1 : -1;

    // Default: string compare (case-insensitive, locale-aware)
    return String(a).localeCompare(String(b), undefined, { sensitivity: "base", numeric: true });
}

// Types
export type ColumnDef<T extends object> = {
    /** key in your interface */
    key: keyof T;
    /** header label (defaults to startCase of key) */
    header?: string;
    /** custom cell renderer */
    cell?: (value: T[keyof T], row: T) => React.ReactNode;
    /** enable/disable sorting for this column (default true) */
    sortable?: boolean;
    /** optional td class */
    className?: string;
    /** optional th class */
    headerClassName?: string;
};

export type DataTableProps<T extends object> = {
    /** your data list */
    data: T[];
    /** override/define columns; if omitted, columns are inferred from the first row */
    columns?: ColumnDef<T>[];
    /** optional message when there are no rows */
    emptyMessage?: string;
    /** initial sort (key + direction) */
    initialSort?: { key: keyof T; direction?: "asc" | "desc" };
    /** optional table className */
    className?: string;
};

// Utility: make a nice header label from key
function toStartCase(input: string): string {
    return input
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/[\-_]+/g, " ")
        .replace(/^\w/, (c) => c.toUpperCase())
        .replace(/\s\w/g, (m) => m.toUpperCase());
}

export function DataTable<T extends object>({
    data,
    columns,
    emptyMessage = "Sin datos",
    initialSort,
    className = "",
}: DataTableProps<T>) {
    const inferredColumns: ColumnDef<T>[] = useMemo(() => {
        if (columns && columns.length) return columns;
        const first = data?.[0] ?? ({} as T);
        // Create columns from the object's own keys
        return (Object.keys(first) as Array<keyof T>).map((key) => ({
            key,
            header: toStartCase(String(key)),
            sortable: true,
        }));
    }, [columns, data]);

    const [sort, setSort] = useState<{ key: keyof T; direction: "asc" | "desc" } | null>(
        initialSort ? { key: initialSort.key, direction: initialSort.direction ?? "asc" } : null
    );

    const sortedData = useMemo(() => {
        if (!sort) return data;
        const { key, direction } = sort;
        const dir = direction === "asc" ? 1 : -1;
        return [...data].sort((r1, r2) => dir * compareValues((r1 as any)[key], (r2 as any)[key]));
    }, [data, sort]);

    const onHeaderClick = (col: ColumnDef<T>) => {
        if (col.sortable === false) return;
        const key = col.key;
        setSort((prev) => {
            if (!prev || prev.key !== key) return { key, direction: "asc" };
            return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
        });
    };

    return (
        <div className="w-full overflow-x-auto">
            <table className={`w-full table-auto border-collapse text-sm ${className}`}>
                <thead>
                    <tr className="border-b bg-gray-50">
                        {inferredColumns.map((col) => {
                            const isActive = sort?.key === col.key;
                            const dir = isActive ? (sort!.direction === "asc" ? "↑" : "↓") : "";
                            return (
                                <th
                                    key={String(col.key)}
                                    onClick={() => onHeaderClick(col)}
                                    className={`px-3 py-2 text-left font-semibold whitespace-nowrap select-none ${col.headerClassName ?? ""
                                        } ${col.sortable === false ? "cursor-default" : "cursor-pointer"}`}
                                >
                                    <span className="inline-flex items-center gap-1">
                                        {col.header ?? toStartCase(String(col.key))}
                                        {dir && <span className="text-xs opacity-60">{dir}</span>}
                                    </span>
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody>
                    {sortedData.length === 0 ? (
                        <tr>
                            <td className="px-3 py-4 text-center text-gray-500" colSpan={inferredColumns.length}>
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : (
                        sortedData.map((row, i) => (
                            <tr key={i} className="border-b last:border-0 odd:bg-white even:bg-gray-50 hover:bg-gray-100/60">
                                {inferredColumns.map((col) => {
                                    const value = (row as any)[col.key];
                                    return (
                                        <td key={String(col.key)} className={`px-3 py-2 align-top ${col.className ?? ""}`}>
                                            {col.cell ? col.cell(value, row) : isDateLike(value) ? (
                                                <time dateTime={new Date(String(value)).toISOString()}>
                                                    {new Date(String(value)).toLocaleString()}
                                                </time>
                                            ) : (
                                                String(value)
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
