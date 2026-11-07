import type { DataRow, SummaryStats, YieldResult } from "./yield";

export interface ParsedSpreadsheet {
  rows: DataRow[];
  columns: string[];
  sheetName: string;
}

function isBlank(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
}

function makeUniqueHeaders(values: unknown[]): string[] {
  const used = new Map<string, number>();

  return values.map((value, index) => {
    const base = String(value ?? "").trim() || `Columna ${index + 1}`;
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);

    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

export async function parseSpreadsheet(file: File): Promise<ParsedSpreadsheet> {
  const XLSX = await import("xlsx");
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("El archivo no contiene hojas.");
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  if (matrix.length === 0) {
    throw new Error("La hoja está vacía.");
  }

  const columns = makeUniqueHeaders(matrix[0] ?? []);
  const rows = matrix
    .slice(1)
    .filter((row) => row.some((cell) => !isBlank(cell)))
    .map((row) => {
      const record: DataRow = {};

      columns.forEach((column, index) => {
        record[column] = row[index] ?? null;
      });

      return record;
    });

  if (rows.length === 0) {
    throw new Error("La hoja no contiene filas de datos.");
  }

  return { rows, columns, sheetName };
}

export async function downloadResults(
  results: YieldResult[],
  stats: SummaryStats,
  sourceName: string
): Promise<void> {
  const XLSX = await import("xlsx");
  const dataRows = results.map((result) => ({
    Fila: result.index,
    "Producto real (g)": result.real,
    "Producto teórico (g)": result.theoretical,
    "Rendimiento (%)": Number(result.yield.toFixed(4)),
  }));
  const summaryRows = [
    { Métrica: "Archivo", Valor: sourceName },
    { Métrica: "Filas analizadas", Valor: stats.count },
    { Métrica: "Promedio (%)", Valor: Number(stats.mean.toFixed(4)) },
    { Métrica: "Desvío estándar (%)", Valor: Number(stats.stdDev.toFixed(4)) },
    { Métrica: "Mínimo (%)", Valor: Number(stats.min.toFixed(4)) },
    { Métrica: "25% (%)", Valor: Number(stats.q1.toFixed(4)) },
    { Métrica: "Mediana (%)", Valor: Number(stats.median.toFixed(4)) },
    { Métrica: "75% (%)", Valor: Number(stats.q3.toFixed(4)) },
    { Métrica: "Máximo (%)", Valor: Number(stats.max.toFixed(4)) },
  ];

  const dataSheet = XLSX.utils.json_to_sheet(dataRows);
  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  dataSheet["!cols"] = [{ wch: 10 }, { wch: 18 }, { wch: 20 }, { wch: 18 }];
  summarySheet["!cols"] = [{ wch: 24 }, { wch: 36 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, dataSheet, "Datos");
  XLSX.utils.book_append_sheet(workbook, summarySheet, "Resumen");
  XLSX.writeFile(workbook, "resultados_rendimiento.xlsx");
}
