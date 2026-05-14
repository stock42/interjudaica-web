"use client";

import { Button } from "@/components/ui/button";

function downloadCSV(filename: string, rows: string[][]) {
	const csv = rows.map((row) =>
		row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
	).join("\n");

	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function CSVExportButton<T extends Record<string, unknown>>({
	data,
	columns,
	filename,
}: {
	data: T[];
	columns: Array<{ key: keyof T; label: string }>;
	filename: string;
}) {
	function handleExport() {
		const header = columns.map((c) => c.label);
		const rows = data.map((row) =>
			columns.map((c) => String(row[c.key] ?? "")),
		);
		downloadCSV(`${filename}.csv`, [header, ...rows]);
	}

	if (data.length === 0) return null;

	return (
		<Button variant="outline" size="sm" onClick={handleExport} type="button">
			Export CSV
		</Button>
	);
}
