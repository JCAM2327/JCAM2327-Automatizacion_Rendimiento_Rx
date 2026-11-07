"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { downloadResults, parseSpreadsheet, type ParsedSpreadsheet } from "@/lib/excel";
import {
  analyzeRows,
  detectNumericColumns,
  detectYieldColumns,
  formatNumber,
  summarizeResults,
  type DataRow,
  type SummaryStats,
  type YieldResult,
} from "@/lib/yield";
import { YieldChart } from "@/components/yield-chart";

function formatCell(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "number") {
    return Number.isInteger(value) ? String(value) : formatNumber(value, 2);
  }
  return String(value);
}

export function YieldApp() {
  const [file, setFile] = useState<File | null>(null);
  const [spreadsheet, setSpreadsheet] = useState<ParsedSpreadsheet | null>(null);
  const [rows, setRows] = useState<DataRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [realColumn, setRealColumn] = useState("");
  const [theoreticalColumn, setTheoreticalColumn] = useState("");
  const [results, setResults] = useState<YieldResult[]>([]);
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [calcError, setCalcError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const numericColumns = useMemo(() => detectNumericColumns(rows), [rows]);
  const previewRows = useMemo(() => rows.slice(0, 8), [rows]);
  const insights = useMemo(
    () => (stats ? summarizeResults(results, stats) : null),
    [results, stats]
  );
  const statCards = stats
    ? [
        {
          label: "Filas analizadas",
          value: formatNumber(stats.count, 0),
          detail: "registros",
        },
        {
          label: "Promedio",
          value: `${formatNumber(stats.mean)}%`,
          detail: "rendimiento medio",
        },
        {
          label: "Mediana",
          value: `${formatNumber(stats.median)}%`,
          detail: "percentil 50",
        },
        {
          label: "Desvío estándar",
          value: `${formatNumber(stats.stdDev)}%`,
          detail: "muestral",
        },
        {
          label: "Mínimo",
          value: `${formatNumber(stats.min)}%`,
          detail: "valor más bajo",
        },
        {
          label: "Máximo",
          value: `${formatNumber(stats.max)}%`,
          detail: "valor más alto",
        },
      ]
    : [];

  const clearResults = () => {
    setResults([]);
    setStats(null);
  };

  const loadFile = async (selectedFile: File) => {
    setError(null);
    setCalcError(null);
    setNotice(null);
    setIsLoading(true);
    clearResults();

    try {
      if (selectedFile.size > 10 * 1024 * 1024) {
        throw new Error("El archivo supera el límite de 10 MB.");
      }

      const parsed = await parseSpreadsheet(selectedFile);
      const detectedNumericColumns = detectNumericColumns(parsed.rows);
      const selection = detectYieldColumns(parsed.columns, parsed.rows);

      setFile(selectedFile);
      setSpreadsheet(parsed);
      setRows(parsed.rows);
      setColumns(parsed.columns);
      setRealColumn(selection.realColumn);
      setTheoreticalColumn(selection.theoreticalColumn);

      if (detectedNumericColumns.length < 2) {
        setNotice(
          "No se detectaron dos columnas numéricas. Seleccioná manualmente las columnas de producto real y producto teórico."
        );
      } else if (selection.matchedByName) {
        setNotice(
          `Detectamos automáticamente "${selection.realColumn}" y "${selection.theoreticalColumn}" por el nombre de los encabezados. Revisá que sean las columnas correctas.`
        );
      }
    } catch (caughtError) {
      setFile(null);
      setSpreadsheet(null);
      setRows([]);
      setColumns([]);
      setRealColumn("");
      setTheoreticalColumn("");
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo leer el archivo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      void loadFile(selectedFile);
    }
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const selectedFile = event.dataTransfer.files?.[0];
    if (selectedFile) {
      void loadFile(selectedFile);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSample = async () => {
    setError(null);
    setCalcError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/datos_reactivos.xlsx");
      if (!response.ok) {
        throw new Error("No se pudo cargar el archivo de ejemplo.");
      }
      const blob = await response.blob();
      const sampleFile = new File([blob], "datos_reactivos.xlsx", {
        type:
          blob.type ||
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      await loadFile(sampleFile);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "No se pudo cargar el archivo de ejemplo."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleColumnChange = (nextReal: string, nextTheoretical: string) => {
    setRealColumn(nextReal);
    setTheoreticalColumn(nextTheoretical);
    clearResults();
    setError(null);
    setCalcError(null);
    setNotice(null);
  };

  const handleCalculate = () => {
    setError(null);
    setNotice(null);
    setCalcError(null);

    if (realColumn && realColumn === theoreticalColumn) {
      clearResults();
      setCalcError(
        "Elegí columnas distintas para el producto real y el producto teórico."
      );
      return;
    }

    const analysis = analyzeRows(rows, realColumn, theoreticalColumn);

    if (!analysis.ok) {
      clearResults();
      setCalcError(analysis.error);
      return;
    }

    setResults(analysis.results);
    setStats(analysis.stats);

    window.setTimeout(() => {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const handleDownload = async () => {
    if (!stats || results.length === 0) return;

    try {
      await downloadResults(
        results,
        stats,
        file?.name ?? spreadsheet?.sheetName ?? "datos"
      );
    } catch {
      setError("No se pudo generar el archivo Excel.");
    }
  };

  const handleReset = () => {
    setFile(null);
    setSpreadsheet(null);
    setRows([]);
    setColumns([]);
    setRealColumn("");
    setTheoreticalColumn("");
    clearResults();
    setError(null);
    setCalcError(null);
    setNotice(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <main>
      <header className="hero">
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Química y ciencias</p>
            <h1>Automatización de rendimiento en reacciones</h1>
            <p className="hero-lead">
              Calculá y visualizá el rendimiento de síntesis químicas a partir
              de archivos Excel o CSV. Los datos se procesan en tu navegador.
            </p>
            <div className="hero-badges">
              <span>MVP</span>
              <span>Cálculo local</span>
              <span>Next.js + Vercel</span>
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="hero-art-card">
              <div className="hero-art-head">
                <span>Rendimiento</span>
                <strong>78.4%</strong>
              </div>
              <div className="hero-bars">
                <i style={{ height: "42%" }} />
                <i style={{ height: "66%" }} />
                <i style={{ height: "54%" }} />
                <i style={{ height: "82%" }} />
                <i style={{ height: "71%" }} />
                <i style={{ height: "60%" }} />
              </div>
              <div className="hero-art-foot">
                <span>producto real</span>
                <span>producto teórico</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="app-shell" id="app">
        <section className="app-card guide-card" aria-labelledby="guide-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow eyebrow-small">Antes de empezar</p>
              <h2 id="guide-title">Qué necesitás y qué hace la app</h2>
              <p>
                La app no modifica el archivo original: lee los datos en tu
                navegador y calcula el rendimiento sin enviarlos a un servidor.
              </p>
            </div>
          </div>

          <div className="guide-grid">
            <article className="guide-item">
              <span className="guide-index">01</span>
              <h3>Formato del archivo</h3>
              <ul>
                <li>La primera fila debe contener los encabezados.</li>
                <li>
                  Necesitás al menos dos columnas numéricas: producto real y
                  producto teórico.
                </li>
                <li>Ambas columnas deben usar la misma unidad de masa (g).</li>
                <li>No puede haber valores nulos en las columnas elegidas.</li>
                <li>
                  El producto real debe ser mayor o igual a 0 y el teórico,
                  mayor que 0.
                </li>
              </ul>
            </article>

            <article className="guide-item">
              <span className="guide-index">02</span>
              <h3>Qué hace la app</h3>
              <ol>
                <li>Lee el archivo Excel o CSV en el navegador.</li>
                <li>
                  Detecta las columnas por sus encabezados y te permite
                  corregirlas.
                </li>
                <li>
                  Calcula el rendimiento de cada fila: producto real ÷ producto
                  teórico × 100.
                </li>
                <li>
                  Resume promedio, mediana, desvío estándar, mínimo, máximo y
                  tolerancia de ±5%.
                </li>
              </ol>
            </article>

            <article className="guide-item">
              <span className="guide-index">03</span>
              <h3>Cómo leer los resultados</h3>
              <ul>
                <li>Cada barra representa una fila o experimento.</li>
                <li>La línea azul marca el rendimiento promedio.</li>
                <li>Las líneas rojas marcan el margen de ±5%.</li>
                <li>
                  Un rendimiento mayor a 100% no siempre es un error, pero
                  conviene revisar masas, unidades y pureza.
                </li>
              </ul>
            </article>
          </div>
        </section>

        <section className="app-card" aria-labelledby="upload-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow eyebrow-small">Paso 1</p>
              <h2 id="upload-title">Cargar datos</h2>
              <p>
                Subí un archivo con las columnas de producto real y producto
                teórico. La primera fila debe contener los encabezados.
              </p>
            </div>
          </div>

          <div
            className={`dropzone${isDragging ? " is-dragging" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={inputRef}
              id="file-input"
              className="sr-only"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
            <label htmlFor="file-input" className="dropzone-main">
              <span className="dropzone-icon">
                <UploadIcon />
              </span>
              <span className="dropzone-text">
                <strong>Seleccioná un archivo</strong> o arrastralo acá
              </span>
              <span className="dropzone-help">
                Excel (.xlsx, .xls) o CSV · máximo 10 MB
              </span>
            </label>
            <div className="dropzone-actions">
              <button
                className="button button-secondary"
                type="button"
                onClick={handleSample}
                disabled={isLoading}
              >
                {isLoading ? "Cargando..." : "Cargar ejemplo"}
              </button>
              <a className="text-link" href="/datos_reactivos.xlsx" download>
                Descargar ejemplo
              </a>
            </div>
          </div>

          {isLoading ? (
            <p className="message message-info" role="status">
              Leyendo el archivo y detectando las columnas numéricas...
            </p>
          ) : null}

          {error ? (
            <p className="message message-error" role="alert">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="message message-notice" role="status">
              {notice}
            </p>
          ) : null}

          {file && spreadsheet ? (
            <div className="file-status">
              <div className="file-status-main">
                <span className="file-icon">
                  <FileIcon />
                </span>
                <div>
                  <strong>{file.name}</strong>
                  <span>
                    {formatNumber(rows.length, 0)} filas ·{" "}
                    {formatNumber(columns.length, 0)} columnas · hoja{" "}
                    {spreadsheet.sheetName}
                  </span>
                </div>
              </div>
              <button
                className="button button-ghost"
                type="button"
                onClick={handleReset}
              >
                Cambiar archivo
              </button>
            </div>
          ) : null}
        </section>

        {rows.length > 0 ? (
          <>
            <section className="app-card" aria-labelledby="preview-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow eyebrow-small">Vista previa</p>
                  <h2 id="preview-title">Primeras filas</h2>
                  <p>
                    Se muestran hasta 8 filas. El cálculo se aplica a todas las
                    filas del archivo.
                  </p>
                </div>
              </div>

              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th key={column} scope="col">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {columns.map((column) => (
                          <td key={column}>{formatCell(row[column])}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="app-card" aria-labelledby="columns-title">
              <div className="section-heading">
                <div>
                  <p className="eyebrow eyebrow-small">Paso 2</p>
                  <h2 id="columns-title">Columnas de cálculo</h2>
                  <p>
                    Elegí qué columnas corresponden al producto real y al
                    producto teórico.
                  </p>
                </div>
                <span className="column-count">
                  {numericColumns.length} columnas numéricas detectadas
                </span>
              </div>

              <p className="field-help">
                La app intenta reconocer las columnas por sus encabezados
                (&quot;real&quot; y &quot;teórico&quot;). Si no los encuentra,
                usa las primeras columnas numéricas. Revisá la selección antes
                de calcular.
              </p>

              <div className="field-grid">
                <label className="field">
                  <span>Producto real (g)</span>
                  <select
                    value={realColumn}
                    onChange={(event) =>
                      handleColumnChange(event.target.value, theoreticalColumn)
                    }
                  >
                    {columns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Producto teórico (g)</span>
                  <select
                    value={theoreticalColumn}
                    onChange={(event) =>
                      handleColumnChange(realColumn, event.target.value)
                    }
                  >
                    {columns.map((column) => (
                      <option key={column} value={column}>
                        {column}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="formula">
                <span>Fórmula</span>
                <code>rendimiento (%) = producto real / producto teórico × 100</code>
              </div>

              <div className="form-actions">
                <button
                  className="button button-primary"
                  type="button"
                  onClick={handleCalculate}
                  disabled={isLoading}
                >
                  Calcular rendimiento
                </button>
                <button
                  className="button button-ghost"
                  type="button"
                  onClick={handleReset}
                >
                  Limpiar
                </button>
              </div>

              {calcError ? (
                <p className="message message-error" role="alert">
                  {calcError}
                </p>
              ) : null}
            </section>
          </>
        ) : null}

        {results.length > 0 && stats ? (
          <section
            ref={resultsRef}
            className="results-section"
            id="resultados"
            aria-labelledby="results-title"
            aria-live="polite"
          >
            <div className="section-heading">
              <div>
                <p className="eyebrow eyebrow-small">Paso 3</p>
                <h2 id="results-title">Resultados</h2>
                <p>
                  Rendimiento calculado para {formatNumber(stats.count, 0)}{" "}
                  filas.
                </p>
              </div>
              <button
                className="button button-primary"
                type="button"
                onClick={handleDownload}
              >
                <DownloadIcon />
                Descargar Excel
              </button>
            </div>

            <div className="stats-grid">
              {statCards.map((card) => (
                <article className="stat-card" key={card.label}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                  <small>{card.detail}</small>
                </article>
              ))}
            </div>

            <p className="tolerance-note">
              Rango de tolerancia ±5%: {formatNumber(stats.mean * 0.95)}% –{" "}
              {formatNumber(stats.mean * 1.05)}%.
            </p>

            <div className="app-card chart-card">
              <div className="chart-head">
                <div>
                  <h3>Rendimiento por fila</h3>
                  <p>
                    {formatNumber(stats.count, 0)} filas · promedio{" "}
                    {formatNumber(stats.mean)}%
                  </p>
                </div>
              </div>
              <YieldChart results={results} stats={stats} />
            </div>

            {insights ? (
              <section
                className="app-card insight-card"
                aria-labelledby="insights-title"
              >
                <div className="section-heading">
                  <div>
                    <p className="eyebrow eyebrow-small">
                      Lectura del análisis
                    </p>
                    <h3 id="insights-title">Qué dicen estos resultados</h3>
                    <p>
                      Resumen automático para orientar la interpretación de los
                      datos cargados.
                    </p>
                  </div>
                </div>

                <ul className="insight-list">
                  <li>{insights.overview}</li>
                  <li>{insights.range}</li>
                  <li>{insights.tolerance}</li>
                  <li>{insights.dispersion}</li>
                </ul>

                <p className="insight-conclusion">
                  <strong>Conclusión:</strong> {insights.conclusion}
                </p>
                <p className="tolerance-note">
                  Esta lectura es automática y no reemplaza la validación
                  experimental, el análisis de unidades ni la revisión de
                  pureza de los productos.
                </p>
              </section>
            ) : null}

            <div className="app-card">
              <div className="table-heading">
                <div>
                  <h3>Detalle por fila</h3>
                  <p>Valores calculados a partir de las columnas elegidas.</p>
                </div>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={handleDownload}
                >
                  Descargar Excel
                </button>
              </div>

              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Fila</th>
                      <th scope="col">Producto real (g)</th>
                      <th scope="col">Producto teórico (g)</th>
                      <th scope="col">Rendimiento (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.index}>
                        <td>{result.index}</td>
                        <td>{formatNumber(result.real, 2)}</td>
                        <td>{formatNumber(result.theoretical, 2)}</td>
                        <td className="yield-cell">
                          {formatNumber(result.yield, 2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        ) : null}
      </div>

    </main>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 16V4m0 0 4 4m-4-4-4 4M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M14 3v5h5M9 13h6M9 17h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4v12m0 0 4-4m-4 4-4-4M5 20h14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
