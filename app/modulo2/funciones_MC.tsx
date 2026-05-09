"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Dice5,
  LineChart,
  Play,
  RotateCcw,
} from "lucide-react";
import type { RegistroMensual } from "./funciones_datos";

type HorizonteMC = 6 | 12 | 24;

type ParametrosMC = {
  horizonte: HorizonteMC;
  numeroSimulaciones: number;
  muV: number;
  sigmaV: number;
  muC: number;
  sigmaC: number;
  muG: number;
  sigmaG: number;
};

type PuntoPromedioMC = {
  mes: string;
  ventas: number;
  costos: number;
  gastos: number;
  beneficio: number;
};

type ResultadoMC = {
  puntosPromedio: PuntoPromedioMC[];
  beneficiosAcumulados: number[];
  trayectoriasVentas: number[][];
  beneficioEsperadoAcumulado: number;
  probabilidadPerdida: number;
  ventaPromedioFinal: number;
  costoPromedioFinal: number;
  gastoPromedioFinal: number;
  beneficioPromedioFinal: number;
};

const PARAMETROS_MC_VACIOS: ParametrosMC = {
  horizonte: 6,
  numeroSimulaciones: 1000,
  muV: 0,
  sigmaV: 0,
  muC: 0,
  sigmaC: 0,
  muG: 0,
  sigmaG: 0,
};

export function MonteCarloEstandar({
  registrosSeleccionados,
}: {
  registrosSeleccionados: RegistroMensual[];
}) {
  const parametrosPredeterminados = useMemo(() => {
    return calcularParametrosMCHistoricos(registrosSeleccionados);
  }, [registrosSeleccionados]);

  const [parametros, setParametros] = useState<ParametrosMC>(
    PARAMETROS_MC_VACIOS
  );

  const [semilla, setSemilla] = useState(12345);

  useEffect(() => {
    if (parametrosPredeterminados) {
      setParametros(parametrosPredeterminados);
    } else {
      setParametros(PARAMETROS_MC_VACIOS);
    }
  }, [parametrosPredeterminados]);

  const resultado = useMemo(() => {
    if (!parametrosPredeterminados) return null;

    return simularMonteCarloEstandar({
      registrosSeleccionados,
      parametros,
      semilla,
    });
  }, [registrosSeleccionados, parametros, parametrosPredeterminados, semilla]);

  function actualizarParametro<K extends keyof ParametrosMC>(
    nombre: K,
    valor: ParametrosMC[K]
  ) {
    setParametros((prev) => ({
      ...prev,
      [nombre]: valor,
    }));
  }

  function resetearParametros() {
    if (parametrosPredeterminados) {
      setParametros(parametrosPredeterminados);
      setSemilla((prev) => prev + 1);
    }
  }

  function ejecutarNuevaSimulacion() {
    setSemilla((prev) => prev + 1);
  }

  if (registrosSeleccionados.length < 2 || !parametrosPredeterminados) {
    return (
      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1" size={22} />
          <div>
            <h2 className="font-bold">Monte Carlo no disponible todavía</h2>
            <p className="mt-1 text-sm">
              Selecciona al menos dos registros mensuales activos para calcular
              rendimientos logarítmicos y volatilidades históricas.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="grid grid-cols-12 gap-6">
      <div className="col-span-12 space-y-6 xl:col-span-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Dice5 size={28} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#07133b]">
                Simulación Monte Carlo estándar
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Genera múltiples trayectorias futuras para ventas, costos,
                gastos y beneficio neto usando rendimientos logarítmicos.
              </p>
            </div>
          </div>
        </div>

        {resultado && (
          <>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <MetricCard
                label={`Venta promedio final (${parametros.horizonte}M)`}
                value={formatoMoneda(resultado.ventaPromedioFinal)}
              />

              <MetricCard
                label={`Costo promedio final (${parametros.horizonte}M)`}
                value={formatoMoneda(resultado.costoPromedioFinal)}
              />

              <MetricCard
                label={`Gasto promedio final (${parametros.horizonte}M)`}
                value={formatoMoneda(resultado.gastoPromedioFinal)}
              />

              <MetricCard
                label="Probabilidad de pérdida"
                value={formatoPorcentaje(resultado.probabilidadPerdida)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MetricCard
                label="Beneficio esperado acumulado"
                value={formatoMoneda(resultado.beneficioEsperadoAcumulado)}
              />

              <MetricCard
                label="Beneficio promedio final"
                value={formatoMoneda(resultado.beneficioPromedioFinal)}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <LineChart size={20} className="text-blue-700" />
                <div>
                  <h3 className="text-xl font-bold text-[#07133b]">
                    Trayectorias simuladas de ventas
                  </h3>
                  <p className="text-sm text-slate-500">
                    Muestra de trayectorias Monte Carlo y trayectoria promedio.
                  </p>
                </div>
              </div>

              <SvgTrayectoriasVentas
                trayectorias={resultado.trayectoriasVentas}
                promedio={resultado.puntosPromedio.map((p) => p.ventas)}
                labels={resultado.puntosPromedio.map((p) => p.mes)}
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-700" />
                <div>
                  <h3 className="text-xl font-bold text-[#07133b]">
                    Distribución del beneficio acumulado
                  </h3>
                  <p className="text-sm text-slate-500">
                    Histograma de beneficios acumulados al final del horizonte.
                  </p>
                </div>
              </div>

              <SvgHistogramaBeneficio
                values={resultado.beneficiosAcumulados}
              />
            </div>
          </>
        )}
      </div>

      <aside className="col-span-12 xl:col-span-4">
        <PanelParametrosMC
          parametros={parametros}
          parametrosPredeterminados={parametrosPredeterminados}
          actualizarParametro={actualizarParametro}
          resetearParametros={resetearParametros}
          ejecutarNuevaSimulacion={ejecutarNuevaSimulacion}
        />
      </aside>
    </section>
  );
}

function PanelParametrosMC({
  parametros,
  parametrosPredeterminados,
  actualizarParametro,
  resetearParametros,
  ejecutarNuevaSimulacion,
}: {
  parametros: ParametrosMC;
  parametrosPredeterminados: ParametrosMC;
  actualizarParametro: <K extends keyof ParametrosMC>(
    nombre: K,
    valor: ParametrosMC[K]
  ) => void;
  resetearParametros: () => void;
  ejecutarNuevaSimulacion: () => void;
}) {
  return (
    <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#07133b]">
          Parámetros Monte Carlo
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Modifica los supuestos y ejecuta nuevas simulaciones.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-600">
            Horizonte de simulación
          </p>

          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 text-sm">
            {[6, 12, 24].map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() =>
                  actualizarParametro("horizonte", opcion as HorizonteMC)
                }
                className={`px-4 py-3 transition ${
                  parametros.horizonte === opcion
                    ? "bg-blue-700 font-semibold text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opcion}M
              </button>
            ))}
          </div>
        </div>

        <NumeroInput
          label="Número de simulaciones"
          value={parametros.numeroSimulaciones}
          min={100}
          max={10000}
          step={100}
          onChange={(valor) =>
            actualizarParametro("numeroSimulaciones", valor)
          }
        />

        <div className="border-t border-slate-200 pt-5">
          <h3 className="font-bold text-[#07133b]">Ventas</h3>

          <div className="mt-4 space-y-4">
            <PorcentajeInput
              label="μ ventas"
              value={parametros.muV}
              defaultValue={parametrosPredeterminados.muV}
              onChange={(valor) => actualizarParametro("muV", valor)}
            />

            <PorcentajeInput
              label="σ ventas"
              value={parametros.sigmaV}
              defaultValue={parametrosPredeterminados.sigmaV}
              onChange={(valor) => actualizarParametro("sigmaV", valor)}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <h3 className="font-bold text-[#07133b]">Costos</h3>

          <div className="mt-4 space-y-4">
            <PorcentajeInput
              label="μ costos"
              value={parametros.muC}
              defaultValue={parametrosPredeterminados.muC}
              onChange={(valor) => actualizarParametro("muC", valor)}
            />

            <PorcentajeInput
              label="σ costos"
              value={parametros.sigmaC}
              defaultValue={parametrosPredeterminados.sigmaC}
              onChange={(valor) => actualizarParametro("sigmaC", valor)}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <h3 className="font-bold text-[#07133b]">Gastos</h3>

          <div className="mt-4 space-y-4">
            <PorcentajeInput
              label="μ gastos"
              value={parametros.muG}
              defaultValue={parametrosPredeterminados.muG}
              onChange={(valor) => actualizarParametro("muG", valor)}
            />

            <PorcentajeInput
              label="σ gastos"
              value={parametros.sigmaG}
              defaultValue={parametrosPredeterminados.sigmaG}
              onChange={(valor) => actualizarParametro("sigmaG", valor)}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={resetearParametros}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 font-semibold text-blue-700 transition hover:bg-blue-50"
          >
            <RotateCcw size={18} />
            Restaurar predeterminados
          </button>

          <button
            type="button"
            onClick={ejecutarNuevaSimulacion}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-blue-800"
          >
            <Play size={18} fill="white" />
            Ejecutar simulación
          </button>
        </div>
      </div>
    </div>
  );
}

function NumeroInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </label>

      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const nuevoValor = Number(event.target.value);
          const valorAcotado = Math.min(max, Math.max(min, nuevoValor));
          onChange(Number.isFinite(valorAcotado) ? valorAcotado : min);
        }}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#07133b] outline-none"
      />
    </div>
  );
}

function PorcentajeInput({
  label,
  value,
  defaultValue,
  onChange,
}: {
  label: string;
  value: number;
  defaultValue: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <span className="text-xs text-slate-400">
          Pred.: {formatoPorcentaje(defaultValue)}
        </span>
      </div>

      <div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3">
        <input
          type="number"
          step="0.01"
          value={decimalAPorcentajeInput(value)}
          onChange={(event) => {
            const nuevoValor = Number(event.target.value);
            onChange(Number.isFinite(nuevoValor) ? nuevoValor / 100 : 0);
          }}
          className="w-full bg-transparent text-sm font-semibold text-[#07133b] outline-none"
        />
        <span className="ml-2 text-sm font-medium text-slate-500">%</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-[#07133b]">{value}</p>
    </div>
  );
}

/* =========================
   GRÁFICAS SVG CON EJES
========================= */

function SvgTrayectoriasVentas({
  trayectorias,
  promedio,
  labels,
}: {
  trayectorias: number[][];
  promedio: number[];
  labels: string[];
}) {
  const width = 900;
  const height = 320;
  const paddingLeft = 80;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 42;

  const allValues = [...trayectorias.flat(), ...promedio];
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(0, ...allValues);

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const x = (index: number) => {
    if (labels.length <= 1) return paddingLeft;
    return paddingLeft + (index * chartWidth) / (labels.length - 1);
  };

  const y = (value: number) => {
    const range = maxValue - minValue || 1;
    return paddingTop + ((maxValue - value) * chartHeight) / range;
  };

  const yTicks = Array.from({ length: 5 }).map((_, index) => {
    return minValue + ((maxValue - minValue) * index) / 4;
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[360px] min-w-[720px] w-full"
      >
        {yTicks.map((tick) => {
          const yPos = y(tick);

          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={yPos}
                y2={yPos}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />

              <text
                x={paddingLeft - 12}
                y={yPos + 4}
                textAnchor="end"
                fontSize="11"
                fill="#64748b"
              >
                {formatoMontoCompacto(tick)}
              </text>
            </g>
          );
        })}

        <line
          x1={paddingLeft}
          x2={paddingLeft}
          y1={paddingTop}
          y2={height - paddingBottom}
          stroke="#94a3b8"
        />

        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={height - paddingBottom}
          y2={height - paddingBottom}
          stroke="#94a3b8"
        />

        {trayectorias.map((trayectoria, index) => {
          const points = trayectoria
            .map((value, i) => `${x(i)},${y(value)}`)
            .join(" ");

          return (
            <polyline
              key={index}
              points={points}
              fill="none"
              stroke="#94a3b8"
              strokeWidth="1.4"
              opacity="0.25"
            />
          );
        })}

        <polyline
          points={promedio.map((value, i) => `${x(i)},${y(value)}`).join(" ")}
          fill="none"
          stroke="#2563eb"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {promedio.map((value, i) => (
          <circle key={i} cx={x(i)} cy={y(value)} r="4" fill="#2563eb" />
        ))}

        {labels.map((label, index) => {
          const mostrar =
            labels.length <= 6 || index % Math.ceil(labels.length / 6) === 0;

          if (!mostrar) return null;

          return (
            <text
              key={`${label}-${index}`}
              x={x(index)}
              y={height - 14}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {label}
            </text>
          );
        })}

        <text
          x={paddingLeft}
          y={18}
          textAnchor="start"
          fontSize="11"
          fill="#64748b"
        >
          Ventas simuladas
        </text>
      </svg>
    </div>
  );
}

function SvgHistogramaBeneficio({ values }: { values: number[] }) {
  const bins = calcularHistograma(values, 14);

  const width = 900;
  const height = 320;
  const paddingLeft = 80;
  const paddingRight = 30;
  const paddingTop = 30;
  const paddingBottom = 48;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxCount = Math.max(...bins.map((bin) => bin.count), 1);
  const barWidth = chartWidth / bins.length - 6;

  const y = (count: number) => {
    return paddingTop + ((maxCount - count) * chartHeight) / maxCount;
  };

  const yTicks = Array.from({ length: 5 }).map((_, index) => {
    return Math.round((maxCount * index) / 4);
  });

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[360px] min-w-[720px] w-full"
      >
        {yTicks.map((tick) => {
          const yPos = y(tick);

          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                x2={width - paddingRight}
                y1={yPos}
                y2={yPos}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />

              <text
                x={paddingLeft - 12}
                y={yPos + 4}
                textAnchor="end"
                fontSize="11"
                fill="#64748b"
              >
                {tick}
              </text>
            </g>
          );
        })}

        <line
          x1={paddingLeft}
          x2={paddingLeft}
          y1={paddingTop}
          y2={height - paddingBottom}
          stroke="#94a3b8"
        />

        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={height - paddingBottom}
          y2={height - paddingBottom}
          stroke="#94a3b8"
        />

        {bins.map((bin, index) => {
          const x = paddingLeft + index * (chartWidth / bins.length) + 3;
          const barY = y(bin.count);
          const barHeight = height - paddingBottom - barY;
          const midpoint = (bin.min + bin.max) / 2;

          return (
            <rect
              key={index}
              x={x}
              y={barY}
              width={barWidth}
              height={barHeight}
              rx="5"
              fill={midpoint >= 0 ? "#2563eb" : "#dc2626"}
              opacity="0.85"
            />
          );
        })}

        {bins.map((bin, index) => {
          const mostrar =
            bins.length <= 7 || index % Math.ceil(bins.length / 7) === 0;

          if (!mostrar) return null;

          const x =
            paddingLeft +
            index * (chartWidth / bins.length) +
            barWidth / 2;

          return (
            <text
              key={index}
              x={x}
              y={height - 16}
              textAnchor="middle"
              fontSize="10"
              fill="#64748b"
            >
              {formatoMontoCompacto(bin.min)}
            </text>
          );
        })}

        <text
          x={paddingLeft}
          y={18}
          textAnchor="start"
          fontSize="11"
          fill="#64748b"
        >
          Frecuencia
        </text>

        <text
          x={width / 2}
          y={height - 4}
          textAnchor="middle"
          fontSize="11"
          fill="#64748b"
        >
          Beneficio acumulado
        </text>
      </svg>
    </div>
  );
}

/* =========================
   MOTOR MONTE CARLO
========================= */

function calcularParametrosMCHistoricos(
  registrosSeleccionados: RegistroMensual[]
): ParametrosMC | null {
  const registrosOrdenados = [...registrosSeleccionados].sort((a, b) =>
    String(a.mes).localeCompare(String(b.mes))
  );

  if (registrosOrdenados.length < 2) return null;

  const ventas = registrosOrdenados.map((r) => Number(r.ventas ?? 0));
  const costos = registrosOrdenados.map((r) => Number(r.costos ?? 0));
  const gastos = registrosOrdenados.map((r) => Number(r.gastos ?? 0));

  const rendimientosVentas = calcularRendimientosLogaritmicos(ventas);
  const rendimientosCostos = calcularRendimientosLogaritmicos(costos);
  const rendimientosGastos = calcularRendimientosLogaritmicos(gastos);

  return {
    horizonte: 6,
    numeroSimulaciones: 1000,
    muV: promedio(rendimientosVentas),
    sigmaV: desviacionMuestral(rendimientosVentas),
    muC: promedio(rendimientosCostos),
    sigmaC: desviacionMuestral(rendimientosCostos),
    muG: promedio(rendimientosGastos),
    sigmaG: desviacionMuestral(rendimientosGastos),
  };
}

function simularMonteCarloEstandar({
  registrosSeleccionados,
  parametros,
  semilla,
}: {
  registrosSeleccionados: RegistroMensual[];
  parametros: ParametrosMC;
  semilla: number;
}): ResultadoMC | null {
  const registrosOrdenados = [...registrosSeleccionados].sort((a, b) =>
    String(a.mes).localeCompare(String(b.mes))
  );

  if (registrosOrdenados.length < 2) return null;

  const ultimoRegistro = registrosOrdenados[registrosOrdenados.length - 1];

  const ventasIniciales = Number(ultimoRegistro.ventas ?? 0);
  const costosIniciales = Number(ultimoRegistro.costos ?? 0);
  const gastosIniciales = Number(ultimoRegistro.gastos ?? 0);

  if (ventasIniciales <= 0) return null;

  const H = parametros.horizonte;
  const N = Math.max(100, Math.min(10000, parametros.numeroSimulaciones));

  const rng = crearGeneradorAleatorio(semilla);

  const sumaVentas = Array(H).fill(0);
  const sumaCostos = Array(H).fill(0);
  const sumaGastos = Array(H).fill(0);
  const sumaBeneficios = Array(H).fill(0);

  const beneficiosAcumulados: number[] = [];
  const trayectoriasVentas: number[][] = [];

  for (let i = 0; i < N; i++) {
    let ventasMesAnterior = ventasIniciales;
    let costosMesAnterior = costosIniciales;
    let gastosMesAnterior = gastosIniciales;

    let beneficioAcumulado = 0;
    const trayectoriaVentasActual: number[] = [];

    for (let h = 0; h < H; h++) {
      const zV = normalEstandar(rng);
      const zC = normalEstandar(rng);
      const zG = normalEstandar(rng);

      const ventas = simularValorLognormal(
        ventasMesAnterior,
        parametros.muV,
        parametros.sigmaV,
        zV
      );

      const costos = simularValorLognormal(
        costosMesAnterior,
        parametros.muC,
        parametros.sigmaC,
        zC
      );

      const gastos = simularValorLognormal(
        gastosMesAnterior,
        parametros.muG,
        parametros.sigmaG,
        zG
      );

      const beneficio = ventas - costos - gastos;

      sumaVentas[h] += ventas;
      sumaCostos[h] += costos;
      sumaGastos[h] += gastos;
      sumaBeneficios[h] += beneficio;

      beneficioAcumulado += beneficio;
      trayectoriaVentasActual.push(ventas);

      ventasMesAnterior = ventas;
      costosMesAnterior = costos;
      gastosMesAnterior = gastos;
    }

    beneficiosAcumulados.push(beneficioAcumulado);

    if (i < 40) {
      trayectoriasVentas.push(trayectoriaVentasActual);
    }
  }

  const puntosPromedio: PuntoPromedioMC[] = Array.from({ length: H }).map(
    (_, index) => ({
      mes: sumarMeses(ultimoRegistro.mes, index + 1),
      ventas: sumaVentas[index] / N,
      costos: sumaCostos[index] / N,
      gastos: sumaGastos[index] / N,
      beneficio: sumaBeneficios[index] / N,
    })
  );

  const beneficioEsperadoAcumulado = promedio(beneficiosAcumulados);

  const probabilidadPerdida =
    beneficiosAcumulados.filter((valor) => valor < 0).length / N;

  const ultimoPunto = puntosPromedio[puntosPromedio.length - 1];

  return {
    puntosPromedio,
    beneficiosAcumulados,
    trayectoriasVentas,
    beneficioEsperadoAcumulado,
    probabilidadPerdida,
    ventaPromedioFinal: ultimoPunto?.ventas ?? 0,
    costoPromedioFinal: ultimoPunto?.costos ?? 0,
    gastoPromedioFinal: ultimoPunto?.gastos ?? 0,
    beneficioPromedioFinal: ultimoPunto?.beneficio ?? 0,
  };
}

function simularValorLognormal(
  valorAnterior: number,
  mu: number,
  sigma: number,
  z: number
) {
  if (valorAnterior <= 0) return 0;

  return valorAnterior * Math.exp(mu + sigma * z);
}

function calcularRendimientosLogaritmicos(valores: number[]) {
  const rendimientos: number[] = [];

  for (let i = 1; i < valores.length; i++) {
    const anterior = valores[i - 1];
    const actual = valores[i];

    if (anterior > 0 && actual > 0) {
      rendimientos.push(Math.log(actual / anterior));
    }
  }

  return rendimientos;
}

function calcularHistograma(values: number[], numeroBins: number) {
  if (values.length === 0) {
    return [{ min: 0, max: 0, count: 0 }];
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const binSize = range / numeroBins;

  const bins = Array.from({ length: numeroBins }).map((_, index) => ({
    min: min + index * binSize,
    max: min + (index + 1) * binSize,
    count: 0,
  }));

  values.forEach((value) => {
    const index = Math.min(
      numeroBins - 1,
      Math.floor((value - min) / binSize)
    );

    bins[index].count += 1;
  });

  return bins;
}

/* =========================
   ALEATORIEDAD
========================= */

function crearGeneradorAleatorio(seed: number) {
  let estado = seed % 2147483647;

  if (estado <= 0) {
    estado += 2147483646;
  }

  return function random() {
    estado = (estado * 16807) % 2147483647;
    return (estado - 1) / 2147483646;
  };
}

function normalEstandar(random: () => number) {
  let u = 0;
  let v = 0;

  while (u === 0) u = random();
  while (v === 0) v = random();

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* =========================
   UTILIDADES
========================= */

function promedio(valores: number[]) {
  if (valores.length === 0) return 0;
  return valores.reduce((acc, valor) => acc + valor, 0) / valores.length;
}

function desviacionMuestral(valores: number[]) {
  if (valores.length <= 1) return 0;

  const media = promedio(valores);

  const sumaCuadrados = valores.reduce((acc, valor) => {
    return acc + Math.pow(valor - media, 2);
  }, 0);

  return Math.sqrt(sumaCuadrados / (valores.length - 1));
}

function sumarMeses(fecha: string, mesesASumar: number) {
  const fechaLimpia = fecha.includes("T") ? fecha.split("T")[0] : fecha;
  const [anio, mes] = fechaLimpia.split("-").map(Number);

  const nuevaFecha = new Date(anio, mes - 1 + mesesASumar, 1);

  return new Intl.DateTimeFormat("es-MX", {
    month: "short",
    year: "2-digit",
  }).format(nuevaFecha);
}

function formatoMoneda(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(valor ?? 0));
}

function formatoMontoCompacto(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(valor);
}

function formatoPorcentaje(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(Number(valor ?? 0));
}

function decimalAPorcentajeInput(valor: number) {
  return Number((valor * 100).toFixed(2));
}