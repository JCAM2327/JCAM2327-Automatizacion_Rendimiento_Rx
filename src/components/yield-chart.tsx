"use client";

import { useMemo } from "react";
import { formatNumber, type SummaryStats, type YieldResult } from "@/lib/yield";

interface YieldChartProps {
  results: YieldResult[];
  stats: SummaryStats;
}

export function YieldChart({ results, stats }: YieldChartProps) {
  const chart = useMemo(() => {
    const left = 58;
    const right = 28;
    const top = 24;
    const bottom = 46;
    const barWidth = 26;
    const gap = 18;
    const step = barWidth + gap;
    const plotWidth = Math.max(560, results.length * step);
    const width = left + plotWidth + right;
    const height = 340;
    const plotHeight = height - top - bottom;
    const baseline = top + plotHeight;
    const maxValue = Math.max(
      100,
      ...results.map((result) => result.yield),
      stats.mean * 1.05
    );
    const yMax = Math.max(100, Math.ceil(maxValue / 20) * 20);
    const scaleY = (value: number) =>
      top + plotHeight - (Math.min(value, yMax) / yMax) * plotHeight;
    const ticks = Array.from({ length: 5 }, (_, index) =>
      Math.round((yMax / 4) * index)
    );
    const labelStep = results.length > 30 ? 5 : results.length > 18 ? 2 : 1;
    const showValues = results.length <= 18;
    const averageY = scaleY(stats.mean);
    const upperY = scaleY(stats.mean * 1.05);
    const lowerY = scaleY(stats.mean * 0.95);

    return {
      left,
      right,
      top,
      bottom,
      barWidth,
      step,
      width,
      height,
      baseline,
      yMax,
      scaleY,
      ticks,
      labelStep,
      showValues,
      averageY,
      upperY,
      lowerY,
    };
  }, [results, stats]);

  return (
    <div className="chart-block">
      <div className="chart-scroll">
        <svg
          className="chart-svg"
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          width={chart.width}
          height={chart.height}
          role="img"
          aria-label={`Gráfico de rendimiento por fila. Promedio ${formatNumber(stats.mean)} por ciento.`}
        >
          <defs>
            <linearGradient id="bar-gradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0f766e" />
              <stop offset="1" stopColor="#2dd4bf" />
            </linearGradient>
          </defs>

          {chart.ticks.map((tick) => {
            const y = chart.scaleY(tick);
            return (
              <g key={tick}>
                <line
                  x1={chart.left}
                  y1={y}
                  x2={chart.width - chart.right}
                  y2={y}
                  className="chart-grid-line"
                />
                <text
                  x={chart.left - 12}
                  y={y + 4}
                  textAnchor="end"
                  className="chart-axis-label"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          <line
            x1={chart.left}
            y1={chart.baseline}
            x2={chart.width - chart.right}
            y2={chart.baseline}
            className="chart-axis-line"
          />

          <line
            x1={chart.left}
            y1={chart.upperY}
            x2={chart.width - chart.right}
            y2={chart.upperY}
            className="chart-tolerance-line"
          />
          <line
            x1={chart.left}
            y1={chart.lowerY}
            x2={chart.width - chart.right}
            y2={chart.lowerY}
            className="chart-tolerance-line"
          />
          <line
            x1={chart.left}
            y1={chart.averageY}
            x2={chart.width - chart.right}
            y2={chart.averageY}
            className="chart-average-line"
          />

          {results.map((result, index) => {
            const x =
              chart.left +
              index * chart.step +
              (chart.step - chart.barWidth) / 2;
            const y = chart.scaleY(result.yield);
            const height = chart.baseline - y;

            return (
              <g key={`${result.index}-${index}`}>
                <rect
                  x={x}
                  y={y}
                  width={chart.barWidth}
                  height={Math.max(height, 1)}
                  rx={7}
                  fill="url(#bar-gradient)"
                  className="chart-bar"
                >
                  <title>
                    {`Fila ${result.index}: ${formatNumber(result.yield, 2)}%`}
                  </title>
                </rect>
                {chart.showValues ? (
                  <text
                    x={x + chart.barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="chart-value-label"
                  >
                    {formatNumber(result.yield)}
                  </text>
                ) : null}
                {index % chart.labelStep === 0 ? (
                  <text
                    x={x + chart.barWidth / 2}
                    y={chart.baseline + 22}
                    textAnchor="middle"
                    className="chart-x-label"
                  >
                    {result.index}
                  </text>
                ) : null}
              </g>
            );
          })}

          <text
            x={chart.width - chart.right}
            y={chart.averageY - 8}
            textAnchor="end"
            className="chart-average-label"
          >
            promedio {formatNumber(stats.mean)}%
          </text>
        </svg>
      </div>

      <div className="chart-legend" aria-hidden="true">
        <span>
          <i className="legend-swatch legend-swatch-bar" />
          Rendimiento por fila
        </span>
        <span>
          <i className="legend-swatch legend-swatch-average" />
          Promedio
        </span>
        <span>
          <i className="legend-swatch legend-swatch-tolerance" />
          Tolerancia ±5%
        </span>
      </div>
    </div>
  );
}
