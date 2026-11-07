export type DataRow = Record<string, unknown>;

export interface YieldResult {
  index: number;
  real: number;
  theoretical: number;
  yield: number;
}

export interface SummaryStats {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  q1: number;
  q3: number;
}

export type AnalysisResult =
  | { ok: true; results: YieldResult[]; stats: SummaryStats }
  | { ok: false; error: string };

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === "string" && value.trim() === "");
}

export function parseNumeric(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const normalized =
      trimmed.includes(",") && !trimmed.includes(".")
        ? trimmed.replace(",", ".")
        : trimmed;
    const parsed = Number(normalized);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function detectNumericColumns(rows: DataRow[]): string[] {
  if (rows.length === 0) return [];

  return Object.keys(rows[0]).filter((column) => {
    const values = rows
      .map((row) => row[column])
      .filter((value) => !isBlank(value));

    return values.length > 0 && values.every((value) => parseNumeric(value) !== null);
  });
}

function normalizeLabel(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export interface ColumnSelection {
  realColumn: string;
  theoreticalColumn: string;
  matchedByName: boolean;
}

export function detectYieldColumns(
  columns: string[],
  rows: DataRow[]
): ColumnSelection {
  const numericColumns = detectNumericColumns(rows);
  const labeledColumns = columns.map((column) => ({
    column,
    label: normalizeLabel(column),
  }));
  const realCandidate = labeledColumns.find(
    ({ label }) =>
      /(^|\s)(real|actual|obtenid)/.test(label) &&
      !/teor|theor|esperad/.test(label)
  );
  const theoreticalCandidate = labeledColumns.find(({ label }) =>
    /teor|theor|esperad/.test(label)
  );
  const remainingNumeric = numericColumns.filter(
    (column) =>
      column !== realCandidate?.column &&
      column !== theoreticalCandidate?.column
  );
  const realColumn =
    realCandidate?.column ??
    remainingNumeric[0] ??
    numericColumns[0] ??
    columns[0] ??
    "";
  const theoreticalColumn =
    theoreticalCandidate?.column ??
    remainingNumeric.find((column) => column !== realColumn) ??
    numericColumns.find((column) => column !== realColumn) ??
    columns.find((column) => column !== realColumn) ??
    "";

  return {
    realColumn,
    theoreticalColumn,
    matchedByName: Boolean(realCandidate && theoreticalCandidate),
  };
}

function quantile(sortedValues: number[], q: number): number {
  if (sortedValues.length === 1) return sortedValues[0];

  const position = (sortedValues.length - 1) * q;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  const weight = position - lower;

  return (
    sortedValues[lower] +
    (sortedValues[upper] - sortedValues[lower]) * weight
  );
}

export function computeStats(values: number[]): SummaryStats {
  if (values.length === 0) {
    throw new Error("No hay datos para calcular estadísticas.");
  }

  const sortedValues = [...values].sort((a, b) => a - b);
  const count = sortedValues.length;
  const mean = sortedValues.reduce((sum, value) => sum + value, 0) / count;
  const variance =
    count > 1
      ? sortedValues.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
        (count - 1)
      : 0;

  return {
    count,
    mean,
    median: quantile(sortedValues, 0.5),
    min: sortedValues[0],
    max: sortedValues[count - 1],
    stdDev: Math.sqrt(variance),
    q1: quantile(sortedValues, 0.25),
    q3: quantile(sortedValues, 0.75),
  };
}

export function analyzeRows(
  rows: DataRow[],
  realColumn: string,
  theoreticalColumn: string
): AnalysisResult {
  if (!realColumn || !theoreticalColumn) {
    return {
      ok: false,
      error: "Seleccioná la columna de producto real y la de producto teórico.",
    };
  }

  if (rows.length === 0) {
    return { ok: false, error: "El archivo no contiene filas de datos." };
  }

  const results: YieldResult[] = [];

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const real = parseNumeric(row[realColumn]);
    const theoretical = parseNumeric(row[theoreticalColumn]);
    const rowNumber = index + 2;

    if (real === null) {
      return {
        ok: false,
        error: `La fila ${rowNumber} no tiene un valor numérico válido en "${realColumn}".`,
      };
    }

    if (theoretical === null) {
      return {
        ok: false,
        error: `La fila ${rowNumber} no tiene un valor numérico válido en "${theoreticalColumn}".`,
      };
    }

    if (real < 0) {
      return {
        ok: false,
        error: `La fila ${rowNumber} tiene un producto real negativo.`,
      };
    }

    if (theoretical <= 0) {
      return {
        ok: false,
        error: `La fila ${rowNumber} tiene un producto teórico igual o menor que cero.`,
      };
    }

    results.push({
      index: rowNumber,
      real,
      theoretical,
      yield: (real / theoretical) * 100,
    });
  }

  return {
    ok: true,
    results,
    stats: computeStats(results.map((result) => result.yield)),
  };
}

export interface ResultsSummary {
  overview: string;
  range: string;
  tolerance: string;
  dispersion: string;
  conclusion: string;
}

export function summarizeResults(
  results: YieldResult[],
  stats: SummaryStats
): ResultsSummary {
  const minResult = results.reduce((lowest, result) =>
    result.yield < lowest.yield ? result : lowest
  );
  const maxResult = results.reduce((highest, result) =>
    result.yield > highest.yield ? result : highest
  );
  const tolerance = stats.mean * 0.05;
  const withinTolerance = results.filter(
    (result) => Math.abs(result.yield - stats.mean) <= tolerance
  ).length;
  const withinShare = (withinTolerance / stats.count) * 100;
  const overHundred = results.filter((result) => result.yield > 100).length;

  let conclusion: string;
  if (overHundred > 0) {
    conclusion = `${overHundred} ${
      overHundred === 1 ? "fila supera" : "filas superan"
    } el 100% de rendimiento. Revisá masas, unidades y pureza antes de interpretar esos valores.`;
  } else if (withinTolerance === stats.count) {
    conclusion =
      "Todas las filas quedaron dentro del margen de ±5% respecto del promedio: el conjunto es homogéneo en esa tolerancia.";
  } else {
    conclusion = `${stats.count - withinTolerance} ${
      stats.count - withinTolerance === 1 ? "fila quedó" : "filas quedaron"
    } fuera del margen de ±5%. Conviene revisar esos experimentos antes de sacar conclusiones.`;
  }

  return {
    overview: `Se analizaron ${formatNumber(stats.count, 0)} filas. El rendimiento promedio fue ${formatNumber(
      stats.mean
    )}% y la mediana ${formatNumber(stats.median)}%.`,
    range: `El mínimo fue ${formatNumber(minResult.yield)}% (fila ${
      minResult.index
    }) y el máximo ${formatNumber(maxResult.yield)}% (fila ${maxResult.index}).`,
    tolerance: `${formatNumber(withinTolerance, 0)} de ${formatNumber(
      stats.count,
      0
    )} filas (${formatNumber(
      withinShare
    )}%) quedaron dentro del margen de ±5% del promedio.`,
    dispersion: `El desvío estándar fue ${formatNumber(
      stats.stdDev
    )} puntos porcentuales: cuanto más alto, mayor es la dispersión entre experimentos.`,
    conclusion,
  };
}

export function formatNumber(value: number, digits = 1): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}
