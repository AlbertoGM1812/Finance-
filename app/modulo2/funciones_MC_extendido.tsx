// app/modulo2/funciones_MC_extendido.tsx

"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarRange,
  LineChart,
  Play,
  RotateCcw,
  Waves,
} from "lucide-react";
import type { RegistroMensual } from "./funciones_datos";

type HorizonteExtendido = 1 | 6 | 12;

type ParametrosMCExtendido = {
  horizonte: HorizonteExtendido;
  numeroSimulaciones: number;
  muV: number;
  sigmaV: number;
  usarEstacionalidad: boolean;
  usarChoques: boolean;
  probabilidadChoque: number;
  severidadChoque: number;
  factoresEstacionales: Record<number, number>;
};

type PuntoPromedioExtendido = {
  mes: string;
  promedio: number;
  p5: number;
  p50: number;
  p95: number;
};

type ResultadoMCExtendido = {
  puntos: PuntoPromedioExtendido[];
  trayectoriasVentas: number[][];
  ventasFinales: number[];
  ventaPromedioFinal: number;
  ventaP5Final: number;
  ventaP50Final: number;
  ventaP95Final: number;
  probabilidadCaida: number;
};

const FACTORES_ESTACIONALES_BASE: Record<number, number> = {
  1: 0.89,  // Enero
  2: 0.91,  // Febrero
  3: 0.95,  // Marzo
  4: 0.99,  // Abril
  5: 0.97,  // Mayo
  6: 0.96,  // Junio
  7: 1.02,  // Julio
  8: 1.04,  // Agosto
  9: 0.99,  // Septiembre
  10: 0.98, // Octubre
  11: 1.09, // Noviembre
  12: 1.19, // Diciembre
};

const PARAMETROS_EXTENDIDOS_VACIOS: ParametrosMCExtendido = {
  horizonte: 6,
  numeroSimulaciones: 1000,
  muV: 0,
  sigmaV: 0,
  usarEstacionalidad: false,
  usarChoques: false,
  probabilidadChoque: 0.1,
  severidadChoque: 0.2,
  factoresEstacionales: FACTORES_ESTACIONALES_BASE,
};

export function MonteCarloExtendido({
  registrosSeleccionados,
}: {
  registrosSeleccionados: RegistroMensual[];
}) {
  const parametrosPredeterminados = useMemo(() => {
    return calcularParametrosHistoricosVentas(registrosSeleccionados);
  }, [registrosSeleccionados]);

  const [parametros, setParametros] = useState<ParametrosMCExtendido>(
    PARAMETROS_EXTENDIDOS_VACIOS
  );

  const [semilla, setSemilla] = useState(98765);

  useEffect(() => {
    if (parametrosPredeterminados) {
      setParametros({
        ...PARAMETROS_EXTENDIDOS_VACIOS,
        muV: parametrosPredeterminados.muV,
        sigmaV: parametrosPredeterminados.sigmaV,
      });
    } else {
      setParametros(PARAMETROS_EXTENDIDOS_VACIOS);
    }
  }, [parametrosPredeterminados]);

  const resultado = useMemo(() => {
    if (!parametrosPredeterminados) return null;

    return simularMonteCarloExtendidoVentas({
      registrosSeleccionados,
      parametros,
      semilla,
    });
  }, [registrosSeleccionados, parametros, parametrosPredeterminados, semilla]);

  function actualizarParametro<K extends keyof ParametrosMCExtendido>(
    nombre: K,
    valor: ParametrosMCExtendido[K]
  ) {
    setParametros((prev) => ({
      ...prev,
      [nombre]: valor,
    }));
  }

  function actualizarFactorEstacional(numeroMes: number, factor: number) {
    setParametros((prev) => ({
      ...prev,
      factoresEstacionales: {
        ...prev.factoresEstacionales,
        [numeroMes]: factor,
      },
    }));
  }

  function resetearParametros() {
    if (!parametrosPredeterminados) return;

    setParametros({
      ...PARAMETROS_EXTENDIDOS_VACIOS,
      muV: parametrosPredeterminados.muV,
      sigmaV: parametrosPredeterminados.sigmaV,
    });

    setSemilla((prev) => prev + 1);
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
            <h2 className="font-bold">Monte Carlo extendido no disponible</h2>
            <p className="mt-1 text-sm">
              Selecciona al menos dos registros mensuales activos para calcular
              el crecimiento logarítmico y la volatilidad histórica de ventas.
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
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <Waves size={28} />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-[#07133b]">
                Monte Carlo Extendido
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Simulación recursiva de ventas con opción de estacionalidad,
                choques externos o ambos.
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
                label="Escenario pesimista"
                value={formatoMoneda(resultado.ventaP5Final)}
              />

              <MetricCard
                label="Escenario base"
                value={formatoMoneda(resultado.ventaP50Final)}
              />

              <MetricCard
                label="Escenario optimista"
                value={formatoMoneda(resultado.ventaP95Final)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <MetricCard
                label="Probabilidad de caída vs último dato"
                value={formatoPorcentaje(resultado.probabilidadCaida)}
              />

              <MetricCard
                label="Configuración activa"
                value={textoConfiguracionActiva(parametros)}
              />
            </div>

           <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="mb-5 flex items-center gap-2">
    <LineChart size={20} className="text-indigo-700" />
    <div>
      <h3 className="text-xl font-bold text-[#07133b]">
        {parametros.horizonte === 1
          ? "Distribución de ventas simuladas"
          : "Trayectorias extendidas de ventas"}
      </h3>

      <p className="text-sm text-slate-500">
        {parametros.horizonte === 1
          ? "Diagrama de caja y bigotes para las ventas simuladas del siguiente mes."
          : "Trayectorias simuladas, promedio y bandas percentiles P5, P50 y P95."}
      </p>
    </div>
  </div>

  {parametros.horizonte === 1 ? (
    <SvgCajaBigotesVentas
      values={resultado.ventasFinales}
      label={resultado.puntos[0]?.mes ?? "Mes proyectado"}
    />
  ) : (
    <SvgMonteCarloExtendido
      trayectorias={resultado.trayectoriasVentas}
      promedio={resultado.puntos.map((p) => p.promedio)}
      p5={resultado.puntos.map((p) => p.p5)}
      p50={resultado.puntos.map((p) => p.p50)}
      p95={resultado.puntos.map((p) => p.p95)}
      labels={resultado.puntos.map((p) => p.mes)}
    />
  )}
</div>
          </>
        )}
      </div>

      <aside className="col-span-12 xl:col-span-4">
        <PanelMonteCarloExtendido
          parametros={parametros}
          parametrosPredeterminados={parametrosPredeterminados}
          actualizarParametro={actualizarParametro}
          actualizarFactorEstacional={actualizarFactorEstacional}
          resetearParametros={resetearParametros}
          ejecutarNuevaSimulacion={ejecutarNuevaSimulacion}
        />
      </aside>
    </section>
  );
}

function PanelMonteCarloExtendido({
  parametros,
  parametrosPredeterminados,
  actualizarParametro,
  actualizarFactorEstacional,
  resetearParametros,
  ejecutarNuevaSimulacion,
}: {
  parametros: ParametrosMCExtendido;
  parametrosPredeterminados: { muV: number; sigmaV: number };
  actualizarParametro: <K extends keyof ParametrosMCExtendido>(
    nombre: K,
    valor: ParametrosMCExtendido[K]
  ) => void;
  actualizarFactorEstacional: (numeroMes: number, factor: number) => void;
  resetearParametros: () => void;
  ejecutarNuevaSimulacion: () => void;
}) {
  return (
    <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-[#07133b]">
          Panel Monte Carlo Extendido
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Configura estacionalidad, choques externos y parámetros de ventas.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-600">
            Horizonte de simulación
          </p>

          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 text-sm">
            {[1, 6, 12].map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() =>
                  actualizarParametro(
                    "horizonte",
                    opcion as HorizonteExtendido
                  )
                }
                className={`px-4 py-3 transition ${
                  parametros.horizonte === opcion
                    ? "bg-indigo-700 font-semibold text-white"
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
          <h3 className="font-bold text-[#07133b]">Parámetros de ventas</h3>

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
          <h3 className="font-bold text-[#07133b]">Extensiones del modelo</h3>

          <div className="mt-4 space-y-3">
            <CheckboxInput
              label="Aplicar estacionalidad"
              checked={parametros.usarEstacionalidad}
              onChange={(checked) =>
                actualizarParametro("usarEstacionalidad", checked)
              }
            />

            <CheckboxInput
              label="Aplicar choques externos"
              checked={parametros.usarChoques}
              onChange={(checked) =>
                actualizarParametro("usarChoques", checked)
              }
            />
          </div>
        </div>

        {parametros.usarChoques && (
          <div className="border-t border-slate-200 pt-5">
            <h3 className="font-bold text-[#07133b]">Choques externos</h3>
            <p className="mt-1 text-xs text-slate-500">
              En cada mes simulado puede ocurrir un choque que reduce las
              ventas.
            </p>

            <div className="mt-4 space-y-4">
              <PorcentajeInput
                label="Probabilidad del choque p"
                value={parametros.probabilidadChoque}
                defaultValue={0.1}
                onChange={(valor) =>
                  actualizarParametro(
                    "probabilidadChoque",
                    acotar(valor, 0, 1)
                  )
                }
              />

              <PorcentajeInput
                label="Severidad del choque s"
                value={parametros.severidadChoque}
                defaultValue={0.2}
                onChange={(valor) =>
                  actualizarParametro("severidadChoque", acotar(valor, 0, 1))
                }
              />
            </div>
          </div>
        )}

        {parametros.usarEstacionalidad && (
          <div className="border-t border-slate-200 pt-5">
            <h3 className="font-bold text-[#07133b]">
              Factores estacionales
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              100% significa sin ajuste. Mayor a 100% aumenta ventas; menor a
              100% reduce ventas.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {MESES.map((mes) => (
                <FactorEstacionalInput
                  key={mes.numero}
                  label={mes.label}
                  value={parametros.factoresEstacionales[mes.numero]}
                  onChange={(valor) =>
                    actualizarFactorEstacional(mes.numero, valor)
                  }
                />
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={resetearParametros}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 font-semibold text-indigo-700 transition hover:bg-indigo-50"
          >
            <RotateCcw size={18} />
            Restaurar predeterminados
          </button>

          <button
            type="button"
            onClick={ejecutarNuevaSimulacion}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-700 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-indigo-800"
          >
            <Play size={18} fill="white" />
            Ejecutar simulación
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================
   CONTROLES
========================= */

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

function CheckboxInput({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm font-medium text-slate-600">{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-indigo-700"
      />
    </label>
  );
}

function FactorEstacionalInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
      <label className="mb-1 block text-xs font-medium text-slate-500">
        {label}
      </label>

      <div className="flex items-center rounded-lg border border-slate-200 bg-white px-2 py-2">
        <input
          type="number"
          step="1"
          value={decimalAPorcentajeInput(value)}
          onChange={(event) => {
            const nuevoValor = Number(event.target.value);
            onChange(Number.isFinite(nuevoValor) ? nuevoValor / 100 : 1);
          }}
          className="w-full bg-transparent text-sm font-semibold text-[#07133b] outline-none"
        />
        <span className="ml-1 text-xs font-medium text-slate-500">%</span>
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
   GRÁFICA
========================= */

function SvgMonteCarloExtendido({
  trayectorias,
  promedio,
  p5,
  p50,
  p95,
  labels,
}: {
  trayectorias: number[][];
  promedio: number[];
  p5: number[];
  p50: number[];
  p95: number[];
  labels: string[];
}) {
  const width = 900;
  const height = 340;
  const paddingLeft = 80;
  const paddingRight = 30;
  const paddingTop = 34;
  const paddingBottom = 48;

  const allValues = [
    ...trayectorias.flat(),
    ...promedio,
    ...p5,
    ...p50,
    ...p95,
  ];

  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(0, ...allValues);

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const x = (index: number) => {
    if (labels.length <= 1) return paddingLeft + chartWidth / 2;
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
      <div className="mb-3 flex flex-wrap justify-center gap-5 text-xs text-slate-600">
        <Legend color="#cbd5e1" label="Trayectorias" />
        <Legend color="#2563eb" label="Promedio" />
        <Legend color="#dc2626" label="P5" />
        <Legend color="#0f766e" label="P50" />
        <Legend color="#7c3aed" label="P95" />
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[380px] min-w-[720px] w-full"
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
              strokeWidth="1.2"
              opacity="0.25"
            />
          );
        })}

        <Polyline values={p5} x={x} y={y} color="#dc2626" dashed />
        <Polyline values={p50} x={x} y={y} color="#0f766e" dashed />
        <Polyline values={p95} x={x} y={y} color="#7c3aed" dashed />
        <Polyline values={promedio} x={x} y={y} color="#2563eb" />

        {labels.map((label, index) => {
          const mostrar =
            labels.length <= 6 || index % Math.ceil(labels.length / 6) === 0;

          if (!mostrar) return null;

          return (
            <text
              key={`${label}-${index}`}
              x={x(index)}
              y={height - 16}
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

        <text
          x={width / 2}
          y={height - 4}
          textAnchor="middle"
          fontSize="11"
          fill="#64748b"
        >
          Mes proyectado
        </text>
      </svg>
    </div>
  );
}

function SvgCajaBigotesVentas({
  values,
  label,
}: {
  values: number[];
  label: string;
}) {
  const resumen = calcularResumenCaja(values);

  const width = 900;
  const height = 340;

  const paddingLeft = 80;
  const paddingRight = 40;
  const paddingTop = 54;
  const paddingBottom = 72;

  const chartWidth = width - paddingLeft - paddingRight;
  const boxY = 150;
  const boxHeight = 70;
  const centerY = boxY + boxHeight / 2;

  const minScale = Math.min(resumen.min, resumen.whiskerMin);
  const maxScale = Math.max(resumen.max, resumen.whiskerMax);
  const range = maxScale - minScale || 1;

  const x = (value: number) => {
    return paddingLeft + ((value - minScale) * chartWidth) / range;
  };

  const ticks = Array.from({ length: 6 }).map((_, index) => {
    return minScale + (range * index) / 5;
  });

  const outliersParaGrafica = resumen.outliers.slice(0, 80);

  return (
    <div className="w-full overflow-x-auto">
      <div className="mb-4 grid grid-cols-2 gap-3 text-xs md:grid-cols-5">
        <BoxStat label="Mínimo" value={formatoMoneda(resumen.min)} />
        <BoxStat label="Q1" value={formatoMoneda(resumen.q1)} />
        <BoxStat label="Mediana" value={formatoMoneda(resumen.mediana)} />
        <BoxStat label="Q3" value={formatoMoneda(resumen.q3)} />
        <BoxStat label="Máximo" value={formatoMoneda(resumen.max)} />
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-[360px] min-w-[720px] w-full"
      >
        {/* Líneas verticales de referencia */}
        {ticks.map((tick) => {
          const xPos = x(tick);

          return (
            <g key={tick}>
              <line
                x1={xPos}
                x2={xPos}
                y1={paddingTop}
                y2={height - paddingBottom}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
              />

              <text
                x={xPos}
                y={height - 38}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
              >
                {formatoMontoCompacto(tick)}
              </text>
            </g>
          );
        })}

        {/* Eje horizontal */}
        <line
          x1={paddingLeft}
          x2={width - paddingRight}
          y1={centerY}
          y2={centerY}
          stroke="#94a3b8"
          strokeWidth="1.5"
        />

        {/* Bigote izquierdo */}
        <line
          x1={x(resumen.whiskerMin)}
          x2={x(resumen.q1)}
          y1={centerY}
          y2={centerY}
          stroke="#334155"
          strokeWidth="3"
        />

        {/* Bigote derecho */}
        <line
          x1={x(resumen.q3)}
          x2={x(resumen.whiskerMax)}
          y1={centerY}
          y2={centerY}
          stroke="#334155"
          strokeWidth="3"
        />

        {/* Tope bigote izquierdo */}
        <line
          x1={x(resumen.whiskerMin)}
          x2={x(resumen.whiskerMin)}
          y1={centerY - 32}
          y2={centerY + 32}
          stroke="#334155"
          strokeWidth="3"
        />

        {/* Tope bigote derecho */}
        <line
          x1={x(resumen.whiskerMax)}
          x2={x(resumen.whiskerMax)}
          y1={centerY - 32}
          y2={centerY + 32}
          stroke="#334155"
          strokeWidth="3"
        />

        {/* Caja Q1-Q3 */}
        <rect
          x={x(resumen.q1)}
          y={boxY}
          width={Math.max(2, x(resumen.q3) - x(resumen.q1))}
          height={boxHeight}
          rx="12"
          fill="#e0e7ff"
          stroke="#4f46e5"
          strokeWidth="2.5"
        />

        {/* Mediana */}
        <line
          x1={x(resumen.mediana)}
          x2={x(resumen.mediana)}
          y1={boxY}
          y2={boxY + boxHeight}
          stroke="#1e1b4b"
          strokeWidth="4"
        />

        {/* Promedio */}
        <circle
          cx={x(resumen.promedio)}
          cy={centerY}
          r="6"
          fill="#2563eb"
        />

        <text
          x={x(resumen.promedio)}
          y={centerY - 46}
          textAnchor="middle"
          fontSize="11"
          fill="#2563eb"
          fontWeight="600"
        >
          Promedio
        </text>

        {/* Outliers */}
        {outliersParaGrafica.map((value, index) => (
          <circle
            key={`${value}-${index}`}
            cx={x(value)}
            cy={centerY + 55 + ((index % 3) - 1) * 6}
            r="3.5"
            fill="#dc2626"
            opacity="0.75"
          />
        ))}

        <text
          x={paddingLeft}
          y={24}
          textAnchor="start"
          fontSize="12"
          fill="#64748b"
        >
          Ventas simuladas para {label}
        </text>

        <text
          x={width / 2}
          y={height - 8}
          textAnchor="middle"
          fontSize="11"
          fill="#64748b"
        >
          Valor de ventas simuladas
        </text>
      </svg>
    </div>
  );
}

function Polyline({
  values,
  x,
  y,
  color,
  dashed = false,
}: {
  values: number[];
  x: (index: number) => number;
  y: (value: number) => number;
  color: string;
  dashed?: boolean;
}) {
  return (
    <polyline
      points={values.map((value, i) => `${x(i)},${y(value)}`).join(" ")}
      fill="none"
      stroke={color}
      strokeWidth={dashed ? "2.4" : "4"}
      strokeDasharray={dashed ? "6 5" : undefined}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span>{label}</span>
    </div>
  );
}

/* =========================
   MOTOR MONTE CARLO EXTENDIDO
========================= */

function calcularParametrosHistoricosVentas(
  registrosSeleccionados: RegistroMensual[]
) {
  const registrosOrdenados = [...registrosSeleccionados].sort((a, b) =>
    String(a.mes).localeCompare(String(b.mes))
  );

  if (registrosOrdenados.length < 2) return null;

  const ventas = registrosOrdenados.map((r) => Number(r.ventas ?? 0));
  const rendimientosVentas = calcularRendimientosLogaritmicos(ventas);

  return {
    muV: promedio(rendimientosVentas),
    sigmaV: desviacionMuestral(rendimientosVentas),
  };
}

function simularMonteCarloExtendidoVentas({
  registrosSeleccionados,
  parametros,
  semilla,
}: {
  registrosSeleccionados: RegistroMensual[];
  parametros: ParametrosMCExtendido;
  semilla: number;
}): ResultadoMCExtendido | null {
  const registrosOrdenados = [...registrosSeleccionados].sort((a, b) =>
    String(a.mes).localeCompare(String(b.mes))
  );

  if (registrosOrdenados.length < 2) return null;

  const ultimoRegistro = registrosOrdenados[registrosOrdenados.length - 1];
  const ventasIniciales = Number(ultimoRegistro.ventas ?? 0);

  if (ventasIniciales <= 0) return null;

  const H = parametros.horizonte;
  const N = Math.max(100, Math.min(10000, parametros.numeroSimulaciones));

  const rng = crearGeneradorAleatorio(semilla);

  const trayectoriasCompletas: number[][] = [];
  const trayectoriasParaGrafica: number[][] = [];

  for (let i = 0; i < N; i++) {
    let ventaAnterior = ventasIniciales;
    const trayectoria: number[] = [];

    for (let h = 1; h <= H; h++) {
      const fechaSimulada = obtenerFechaProyectada(ultimoRegistro.mes, h);
      const numeroMes = fechaSimulada.getMonth() + 1;

      const z = normalEstandar(rng);

      const factorEstacional = parametros.usarEstacionalidad
        ? parametros.factoresEstacionales[numeroMes] ?? 1
        : 1;

      const ocurreChoque =
        parametros.usarChoques && rng() < parametros.probabilidadChoque;

      const factorChoque = ocurreChoque ? 1 - parametros.severidadChoque : 1;

      const ventaSimulada =
        ventaAnterior *
        Math.exp(parametros.muV + parametros.sigmaV * z) *
        factorEstacional *
        factorChoque;

      const ventaFinal = Math.max(0, ventaSimulada);

      trayectoria.push(ventaFinal);
      ventaAnterior = ventaFinal;
    }

    trayectoriasCompletas.push(trayectoria);

    if (i < 40) {
      trayectoriasParaGrafica.push(trayectoria);
    }
  }

  const puntos: PuntoPromedioExtendido[] = Array.from({ length: H }).map(
    (_, index) => {
      const valoresMes = trayectoriasCompletas.map(
        (trayectoria) => trayectoria[index]
      );

      return {
        mes: sumarMeses(ultimoRegistro.mes, index + 1),
        promedio: promedio(valoresMes),
        p5: percentil(valoresMes, 0.05),
        p50: percentil(valoresMes, 0.5),
        p95: percentil(valoresMes, 0.95),
      };
    }
  );

  const ventasFinales = trayectoriasCompletas.map(
    (trayectoria) => trayectoria[H - 1]
  );

  const probabilidadCaida =
    ventasFinales.filter((venta) => venta < ventasIniciales).length / N;

  return {
    puntos,
    trayectoriasVentas: trayectoriasParaGrafica,
    ventasFinales,
    ventaPromedioFinal: promedio(ventasFinales),
    ventaP5Final: percentil(ventasFinales, 0.05),
    ventaP50Final: percentil(ventasFinales, 0.5),
    ventaP95Final: percentil(ventasFinales, 0.95),
    probabilidadCaida,
  };
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

const MESES = [
  { numero: 1, label: "Ene" },
  { numero: 2, label: "Feb" },
  { numero: 3, label: "Mar" },
  { numero: 4, label: "Abr" },
  { numero: 5, label: "May" },
  { numero: 6, label: "Jun" },
  { numero: 7, label: "Jul" },
  { numero: 8, label: "Ago" },
  { numero: 9, label: "Sep" },
  { numero: 10, label: "Oct" },
  { numero: 11, label: "Nov" },
  { numero: 12, label: "Dic" },
];

function obtenerFechaProyectada(fecha: string, mesesASumar: number) {
  const fechaLimpia = fecha.includes("T") ? fecha.split("T")[0] : fecha;
  const [anio, mes] = fechaLimpia.split("-").map(Number);

  return new Date(anio, mes - 1 + mesesASumar, 1);
}

function sumarMeses(fecha: string, mesesASumar: number) {
  const nuevaFecha = obtenerFechaProyectada(fecha, mesesASumar);

  return new Intl.DateTimeFormat("es-MX", {
    month: "short",
    year: "2-digit",
  }).format(nuevaFecha);
}

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

function percentil(valores: number[], p: number) {
  if (valores.length === 0) return 0;

  const ordenados = [...valores].sort((a, b) => a - b);
  const posicion = (ordenados.length - 1) * p;
  const base = Math.floor(posicion);
  const resto = posicion - base;

  if (ordenados[base + 1] !== undefined) {
    return ordenados[base] + resto * (ordenados[base + 1] - ordenados[base]);
  }

  return ordenados[base];
}

function acotar(valor: number, minimo: number, maximo: number) {
  return Math.min(maximo, Math.max(minimo, valor));
}


function calcularResumenCaja(values: number[]) {
  if (values.length === 0) {
    return {
      min: 0,
      q1: 0,
      mediana: 0,
      q3: 0,
      max: 0,
      promedio: 0,
      whiskerMin: 0,
      whiskerMax: 0,
      outliers: [] as number[],
    };
  }

  const ordenados = [...values].sort((a, b) => a - b);

  const q1 = percentil(ordenados, 0.25);
  const mediana = percentil(ordenados, 0.5);
  const q3 = percentil(ordenados, 0.75);
  const iqr = q3 - q1;

  const limiteInferior = q1 - 1.5 * iqr;
  const limiteSuperior = q3 + 1.5 * iqr;

  const noOutliers = ordenados.filter(
    (valor) => valor >= limiteInferior && valor <= limiteSuperior
  );

  const outliers = ordenados.filter(
    (valor) => valor < limiteInferior || valor > limiteSuperior
  );

  return {
    min: ordenados[0],
    q1,
    mediana,
    q3,
    max: ordenados[ordenados.length - 1],
    promedio: promedio(ordenados),
    whiskerMin: noOutliers[0] ?? ordenados[0],
    whiskerMax: noOutliers[noOutliers.length - 1] ?? ordenados[ordenados.length - 1],
    outliers,
  };
}

function BoxStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-[#07133b]">{value}</p>
    </div>
  );
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

function textoConfiguracionActiva(parametros: ParametrosMCExtendido) {
  if (parametros.usarEstacionalidad && parametros.usarChoques) {
    return "Estacionalidad + choques";
  }

  if (parametros.usarEstacionalidad) {
    return "Estacionalidad";
  }

  if (parametros.usarChoques) {
    return "Choques externos";
  }

  return "Monte Carlo base";
}