// app/modulo2/funciones_supuesto.tsx

"use client";
import supabase from "@/app/lib/supabase";
import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  LineChart,
  RotateCcw,
  Save,
} from "lucide-react";
import type { RegistroMensual } from "./funciones_datos";

export type Horizonte = 6 | 12 | 24;
export type Escenario = "base" | "optimista" | "pesimista";

type PuntoProyectado = {
  indice: number;
  mes: string;
  ventas: number;
  costos: number;
  gastos: number;
  beneficio: number;
};

type ParametrosDeterministas = {
  gV: number;
  gC: number;
  gG: number;
  sigmaV: number;
  sigmaC: number;
  sigmaG: number;
};

type ResultadoDeterminista = {
  parametros: ParametrosDeterministas;
  escenarios: Record<Escenario, PuntoProyectado[]>;
  ultimoRegistro: {
    mes: string;
    ventas: number;
    costos: number;
    gastos: number;
    beneficio: number;
  } | null;
};

const PARAMETROS_VACIOS: ParametrosDeterministas = {
  gV: 0,
  gC: 0,
  gG: 0,
  sigmaV: 0,
  sigmaC: 0,
  sigmaG: 0,
};

export function useSupuestosDeterministas(
  registrosSeleccionados: RegistroMensual[]
) {
  const [horizonte, setHorizonte] = useState<Horizonte>(6);
  const [escenarioActivo, setEscenarioActivo] = useState<Escenario>("base");

  const parametrosPredeterminados = useMemo(() => {
    return calcularParametrosHistoricos(registrosSeleccionados);
  }, [registrosSeleccionados]);

  const [parametrosEditables, setParametrosEditables] =
    useState<ParametrosDeterministas>(PARAMETROS_VACIOS);

  useEffect(() => {
    if (parametrosPredeterminados) {
      setParametrosEditables(parametrosPredeterminados);
    } else {
      setParametrosEditables(PARAMETROS_VACIOS);
    }
  }, [parametrosPredeterminados]);

  const resultado = useMemo(() => {
    return calcularSimulacionDeterminista({
      registrosSeleccionados,
      horizonte,
      parametros: parametrosEditables,
    });
  }, [registrosSeleccionados, horizonte, parametrosEditables]);

  function actualizarParametro(
    nombreParametro: keyof ParametrosDeterministas,
    nuevoValor: number
  ) {
    setParametrosEditables((prev) => ({
      ...prev,
      [nombreParametro]: nuevoValor,
    }));
  }

  function resetearParametrosPredeterminados() {
    if (parametrosPredeterminados) {
      setParametrosEditables(parametrosPredeterminados);
    }
  }

  return {
    horizonte,
    setHorizonte,
    escenarioActivo,
    setEscenarioActivo,
    parametrosEditables,
    parametrosPredeterminados,
    resultado,
    actualizarParametro,
    resetearParametrosPredeterminados,
    hayDatosSuficientes: registrosSeleccionados.length >= 2,
  };
}

export type SupuestosDeterministasController = ReturnType<
  typeof useSupuestosDeterministas
>;

export function PronosticoDeterminista({
  supuestos,
}: {
  supuestos: SupuestosDeterministasController;
}) {
  const { resultado, escenarioActivo, horizonte } = supuestos;

  const datosEscenario = resultado?.escenarios[escenarioActivo] ?? [];

  const resumen = useMemo(() => {
    return calcularResumenEscenario(datosEscenario);
  }, [datosEscenario]);

  if (!supuestos.hayDatosSuficientes || !resultado) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-1" size={22} />
          <div>
            <h3 className="font-bold">Datos insuficientes para proyectar</h3>
            <p className="mt-1 text-sm">
              Selecciona al menos dos registros mensuales activos para calcular
              tasas de crecimiento y construir la simulación determinista.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ProjectionChartCard
        title="Proyección de ventas, costos y gastos"
        subtitle="Simulación determinista por escenario"
        icon={<LineChart size={20} />}
        escenarioActivo={escenarioActivo}
        horizonte={horizonte}
      >
        <LineProjectionChart datos={datosEscenario} />

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricBox
            label={`Ventas simuladas (${horizonte}M)`}
            value={formatoMoneda(resumen.ventasFinales)}
            variation={calcularVariacion(
              resultado.ultimoRegistro?.ventas ?? 0,
              resumen.ventasFinales
            )}
            color="blue"
          />

          <MetricBox
            label={`Costos simulados (${horizonte}M)`}
            value={formatoMoneda(resumen.costosFinales)}
            variation={calcularVariacion(
              resultado.ultimoRegistro?.costos ?? 0,
              resumen.costosFinales
            )}
            color="teal"
          />

          <MetricBox
            label={`Gastos simulados (${horizonte}M)`}
            value={formatoMoneda(resumen.gastosFinales)}
            variation={calcularVariacion(
              resultado.ultimoRegistro?.gastos ?? 0,
              resumen.gastosFinales
            )}
            color="violet"
          />
        </div>
      </ProjectionChartCard>

      <ProjectionChartCard
        title="Beneficio neto"
        subtitle="Resultado mensual proyectado"
        icon={<BarChart3 size={20} />}
        escenarioActivo={escenarioActivo}
        horizonte={horizonte}
      >
        <BenefitBarChart datos={datosEscenario} />

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <MetricBox
            label={`Beneficio neto final (${horizonte}M)`}
            value={formatoMoneda(resumen.beneficioFinal)}
            color={resumen.beneficioFinal >= 0 ? "blue" : "red"}
          />

          <MetricBox
            label={`Beneficio acumulado (${horizonte}M)`}
            value={formatoMoneda(resumen.beneficioAcumulado)}
            color={resumen.beneficioAcumulado >= 0 ? "teal" : "red"}
          />

          <MetricBox
            label="Primer mes con pérdida"
            value={resumen.primerMesPerdida ?? "Sin pérdida"}
            color={resumen.primerMesPerdida ? "red" : "violet"}
          />
        </div>
      </ProjectionChartCard>
    </>
  );
}

export function PanelControlSupuestos({
  supuestos,
  nombreSimulacion,
  descripcionSimulacion,
  fechaInicio,
  fechaFin,
  registros,
  registrosActivos,
}: {
  supuestos: SupuestosDeterministasController;
  nombreSimulacion: string;
  descripcionSimulacion: string;
  fechaInicio: string;
  fechaFin: string;
  registros: RegistroMensual[];
  registrosActivos: Set<number>;
}) {
  const {
    horizonte,
    setHorizonte,
    escenarioActivo,
    setEscenarioActivo,
    parametrosEditables,
    parametrosPredeterminados,
    actualizarParametro,
    resetearParametrosPredeterminados,
    hayDatosSuficientes,
  } = supuestos;

  const [guardandoSimulacion, setGuardandoSimulacion] = useState(false);
  const [mensajeGuardado, setMensajeGuardado] = useState<string | null>(null);
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null);
  const [simulacionIdGuardada, setSimulacionIdGuardada] = useState<number | null>(
  null
);

  async function guardarSimulacion() {
  try {
    setGuardandoSimulacion(true);
    setMensajeGuardado(null);
    setErrorGuardado(null);

    const empresaId = obtenerCookieSupuestos("empresa_id");

    if (!empresaId) {
      setErrorGuardado("No se encontró empresa_id en la cookie.");
      return;
    }

    if (!nombreSimulacion.trim()) {
      setErrorGuardado("Debes escribir un nombre para la simulación.");
      return;
    }

    const periodosTomados = registros.map((registro) => [
      registro.registro_id,
      registrosActivos.has(registro.registro_id),
    ]);

    const simulacionPayload = {
      empresa_id: Number(empresaId),
      nombre_simulacion: nombreSimulacion.trim(),
      fecha_inicio: convertirMesAFechaInicioSupuestos(fechaInicio),
      fecha_fin: convertirMesAFechaFinSupuestos(fechaFin),
      periodos_tomados: JSON.stringify(periodosTomados),
      descripcion: descripcionSimulacion.trim(),
    };

    if (simulacionIdGuardada) {
      const { error } = await supabase
        .from("simulaciones")
        .update(simulacionPayload)
        .eq("simulacion_id", simulacionIdGuardada);

      if (error) {
        throw error;
      }

      setMensajeGuardado("Simulación actualizada correctamente.");
      return;
    }

    const { data, error } = await supabase
      .from("simulaciones")
      .insert(simulacionPayload)
      .select("simulacion_id")
      .single();

    if (error) {
      throw error;
    }

    setSimulacionIdGuardada(data.simulacion_id);
    setMensajeGuardado("Simulación guardada correctamente.");
  } catch (error) {
    console.error(error);
    setErrorGuardado("No se pudo guardar la simulación.");
  } finally {
    setGuardandoSimulacion(false);
  }
}

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#07133b]">
            Panel de control
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Edita los supuestos y guarda la configuración de la simulación.
          </p>
        </div>

        <button
          type="button"
          onClick={resetearParametrosPredeterminados}
          disabled={!hayDatosSuficientes}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-[#07133b] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      {!hayDatosSuficientes && (
        <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Selecciona al menos dos registros activos para calcular parámetros
          predeterminados.
        </div>
      )}

      <div className="space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-600">
            Horizonte de proyección
          </p>

          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 text-sm">
            {[6, 12, 24].map((opcion) => (
              <button
                key={opcion}
                type="button"
                onClick={() => setHorizonte(opcion as Horizonte)}
                className={`px-4 py-3 transition ${
                  horizonte === opcion
                    ? "bg-blue-700 font-semibold text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {opcion}M
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-600">Escenario</p>

          <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-slate-200 text-sm">
            <ScenarioButton
              label="Pesimista"
              value="pesimista"
              escenarioActivo={escenarioActivo}
              onClick={setEscenarioActivo}
            />
            <ScenarioButton
              label="Base"
              value="base"
              escenarioActivo={escenarioActivo}
              onClick={setEscenarioActivo}
            />
            <ScenarioButton
              label="Optimista"
              value="optimista"
              escenarioActivo={escenarioActivo}
              onClick={setEscenarioActivo}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <h3 className="font-bold text-[#07133b]">
            Parámetros de simulación
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Los valores predeterminados se calculan con los datos activos.
          </p>

          <div className="mt-4 space-y-4">
            <ParametroInput
              label="Crecimiento promedio de ventas"
              value={parametrosEditables.gV}
              defaultValue={parametrosPredeterminados?.gV ?? 0}
              onChange={(valor) => actualizarParametro("gV", valor)}
            />

            <ParametroInput
              label="Crecimiento promedio de costos"
              value={parametrosEditables.gC}
              defaultValue={parametrosPredeterminados?.gC ?? 0}
              onChange={(valor) => actualizarParametro("gC", valor)}
            />

            <ParametroInput
              label="Crecimiento promedio de gastos"
              value={parametrosEditables.gG}
              defaultValue={parametrosPredeterminados?.gG ?? 0}
              onChange={(valor) => actualizarParametro("gG", valor)}
            />

            <ParametroInput
              label="Volatilidad de ventas"
              value={parametrosEditables.sigmaV}
              defaultValue={parametrosPredeterminados?.sigmaV ?? 0}
              onChange={(valor) => actualizarParametro("sigmaV", valor)}
            />

            <ParametroInput
              label="Volatilidad de costos"
              value={parametrosEditables.sigmaC}
              defaultValue={parametrosPredeterminados?.sigmaC ?? 0}
              onChange={(valor) => actualizarParametro("sigmaC", valor)}
            />

            <ParametroInput
              label="Volatilidad de gastos"
              value={parametrosEditables.sigmaG}
              defaultValue={parametrosPredeterminados?.sigmaG ?? 0}
              onChange={(valor) => actualizarParametro("sigmaG", valor)}
            />
          </div>
        </div>

        <div className="border-t border-slate-200 pt-5">
          <button
            type="button"
            onClick={resetearParametrosPredeterminados}
            disabled={!hayDatosSuficientes}
            className="mb-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw size={18} />
            Restaurar valores predeterminados
          </button>

          <button
            type="button"
            onClick={guardarSimulacion}
            disabled={guardandoSimulacion || registros.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={18} />
            {guardandoSimulacion ? "Guardando..." : "Guardar simulación"}
          </button>

          {mensajeGuardado && (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
              {mensajeGuardado}
            </p>
          )}

          {errorGuardado && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
              {errorGuardado}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ScenarioButton({
  label,
  value,
  escenarioActivo,
  onClick,
}: {
  label: string;
  value: Escenario;
  escenarioActivo: Escenario;
  onClick: (value: Escenario) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`px-3 py-3 transition ${
        escenarioActivo === value
          ? "bg-slate-900 font-semibold text-white"
          : "bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      {label}
    </button>
  );
}

function ParametroInput({
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

function ProjectionChartCard({
  title,
  subtitle,
  icon,
  escenarioActivo,
  horizonte,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  escenarioActivo: Escenario;
  horizonte: Horizonte;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-blue-700">{icon}</span>
            <h2 className="text-xl font-bold text-[#07133b]">{title}</h2>
          </div>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="rounded-xl bg-slate-50 px-4 py-2 text-sm font-medium text-slate-600">
          {capitalizar(escenarioActivo)} · {horizonte}M
        </div>
      </div>

      {children}
    </div>
  );
}

function LineProjectionChart({ datos }: { datos: PuntoProyectado[] }) {
  const series = [
    {
      label: "Ventas",
      color: "#2563eb",
      values: datos.map((d) => d.ventas),
    },
    {
      label: "Costos",
      color: "#0f766e",
      values: datos.map((d) => d.costos),
    },
    {
      label: "Gastos",
      color: "#7c3aed",
      values: datos.map((d) => d.gastos),
    },
  ];

  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <div className="mb-3 flex justify-center gap-6 text-xs text-slate-600">
        {series.map((serie) => (
          <div key={serie.label} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: serie.color }}
            />
            <span>{serie.label}</span>
          </div>
        ))}
      </div>

      <SvgLineChart series={series} labels={datos.map((d) => d.mes)} />
    </div>
  );
}

function BenefitBarChart({ datos }: { datos: PuntoProyectado[] }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-4">
      <SvgBarChart
        values={datos.map((d) => d.beneficio)}
        labels={datos.map((d) => d.mes)}
      />
    </div>
  );
}

function SvgLineChart({
  series,
  labels,
}: {
  series: { label: string; color: string; values: number[] }[];
  labels: string[];
}) {
  const width = 900;
  const height = 260;
  const paddingX = 45;
  const paddingY = 28;

  const allValues = series.flatMap((s) => s.values);
  const maxValue = Math.max(...allValues, 1);
  const minValue = Math.min(0, ...allValues);

  const x = (index: number) => {
    if (labels.length <= 1) return paddingX;
    return paddingX + (index * (width - paddingX * 2)) / (labels.length - 1);
  };

  const y = (value: number) => {
    const range = maxValue - minValue || 1;
    return (
      height -
      paddingY -
      ((value - minValue) * (height - paddingY * 2)) / range
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-72 min-w-[720px] w-full"
      >
        {Array.from({ length: 5 }).map((_, index) => {
          const yPos = paddingY + (index * (height - paddingY * 2)) / 4;

          return (
            <line
              key={index}
              x1={paddingX}
              x2={width - paddingX}
              y1={yPos}
              y2={yPos}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
          );
        })}

        {series.map((serie) => {
          const points = serie.values
            .map((value, index) => `${x(index)},${y(value)}`)
            .join(" ");

          return (
            <g key={serie.label}>
              <polyline
                points={points}
                fill="none"
                stroke={serie.color}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {serie.values.map((value, index) => (
                <circle
                  key={`${serie.label}-${index}`}
                  cx={x(index)}
                  cy={y(value)}
                  r="3.5"
                  fill={serie.color}
                />
              ))}
            </g>
          );
        })}

        {labels.map((label, index) => {
          const mostrar =
            labels.length <= 6 || index % Math.ceil(labels.length / 6) === 0;

          if (!mostrar) return null;

          return (
            <text
              key={`${label}-${index}`}
              x={x(index)}
              y={height - 6}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function SvgBarChart({
  values,
  labels,
}: {
  values: number[];
  labels: string[];
}) {
  const width = 900;
  const height = 260;
  const paddingX = 45;
  const paddingY = 28;

  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const range = maxValue - minValue || 1;

  const y = (value: number) => {
    return (
      height -
      paddingY -
      ((value - minValue) * (height - paddingY * 2)) / range
    );
  };

  const baseY = y(0);
  const barWidth = Math.max(14, (width - paddingX * 2) / values.length - 8);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-72 min-w-[720px] w-full"
      >
        {Array.from({ length: 5 }).map((_, index) => {
          const yPos = paddingY + (index * (height - paddingY * 2)) / 4;

          return (
            <line
              key={index}
              x1={paddingX}
              x2={width - paddingX}
              y1={yPos}
              y2={yPos}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
            />
          );
        })}

        <line
          x1={paddingX}
          x2={width - paddingX}
          y1={baseY}
          y2={baseY}
          stroke="#94a3b8"
          strokeWidth="1.5"
        />

        {values.map((value, index) => {
          const x =
            paddingX +
            (index * (width - paddingX * 2)) / values.length +
            4;

          const barY = value >= 0 ? y(value) : baseY;
          const barHeight = Math.abs(y(value) - baseY);

          return (
            <rect
              key={index}
              x={x}
              y={barY}
              width={barWidth}
              height={barHeight}
              rx="5"
              fill={value >= 0 ? "#2563eb" : "#dc2626"}
            />
          );
        })}

        {labels.map((label, index) => {
          const mostrar =
            labels.length <= 6 || index % Math.ceil(labels.length / 6) === 0;

          if (!mostrar) return null;

          const x =
            paddingX +
            (index * (width - paddingX * 2)) / values.length +
            barWidth / 2;

          return (
            <text
              key={`${label}-${index}`}
              x={x}
              y={height - 6}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
            >
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function MetricBox({
  label,
  value,
  variation,
  color,
}: {
  label: string;
  value: string;
  variation?: number | null;
  color: "blue" | "teal" | "violet" | "red";
}) {
  const colorMap = {
    blue: "text-blue-700",
    teal: "text-teal-700",
    violet: "text-violet-700",
    red: "text-red-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-sm text-slate-500">{label}</p>

      <div className="mt-2 flex items-end justify-between gap-3">
        <p className={`text-xl font-bold ${colorMap[color]}`}>{value}</p>

        {variation !== undefined && variation !== null && (
          <span
            className={`text-sm font-semibold ${
              variation >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {variation >= 0 ? "↑" : "↓"}{" "}
            {formatoPorcentaje(Math.abs(variation))}
          </span>
        )}
      </div>
    </div>
  );
}

/* =========================
   MOTOR DETERMINISTA
========================= */

function calcularParametrosHistoricos(
  registrosSeleccionados: RegistroMensual[]
): ParametrosDeterministas | null {
  const registrosOrdenados = [...registrosSeleccionados].sort((a, b) =>
    String(a.mes).localeCompare(String(b.mes))
  );

  if (registrosOrdenados.length < 2) return null;

  const ventas = registrosOrdenados.map((r) => Number(r.ventas ?? 0));
  const costos = registrosOrdenados.map((r) => Number(r.costos ?? 0));
  const gastos = registrosOrdenados.map((r) => Number(r.gastos ?? 0));

  const tasasVentas = calcularTasasCrecimiento(ventas);
  const tasasCostos = calcularTasasCrecimiento(costos);
  const tasasGastos = calcularTasasCrecimiento(gastos);

  return {
    gV: promedio(tasasVentas),
    gC: promedio(tasasCostos),
    gG: promedio(tasasGastos),
    sigmaV: desviacionMuestral(tasasVentas),
    sigmaC: desviacionMuestral(tasasCostos),
    sigmaG: desviacionMuestral(tasasGastos),
  };
}

function calcularSimulacionDeterminista({
  registrosSeleccionados,
  horizonte,
  parametros,
}: {
  registrosSeleccionados: RegistroMensual[];
  horizonte: Horizonte;
  parametros: ParametrosDeterministas;
}): ResultadoDeterminista | null {
  const registrosOrdenados = [...registrosSeleccionados].sort((a, b) =>
    String(a.mes).localeCompare(String(b.mes))
  );

  if (registrosOrdenados.length < 2) return null;

  const ultimo = registrosOrdenados[registrosOrdenados.length - 1];

  const ultimoRegistro = {
    mes: ultimo.mes,
    ventas: Number(ultimo.ventas ?? 0),
    costos: Number(ultimo.costos ?? 0),
    gastos: Number(ultimo.gastos ?? 0),
    beneficio: Number(ultimo.beneficio_neto ?? 0),
  };

  const escenarios: Record<Escenario, PuntoProyectado[]> = {
    base: proyectarEscenario({
      ultimoRegistro,
      ultimoMes: ultimo.mes,
      horizonte,
      gV: parametros.gV,
      gC: parametros.gC,
      gG: parametros.gG,
    }),

    optimista: proyectarEscenario({
      ultimoRegistro,
      ultimoMes: ultimo.mes,
      horizonte,
      gV: parametros.gV + parametros.sigmaV,
      gC: parametros.gC - parametros.sigmaC,
      gG: parametros.gG - parametros.sigmaG,
    }),

    pesimista: proyectarEscenario({
      ultimoRegistro,
      ultimoMes: ultimo.mes,
      horizonte,
      gV: parametros.gV - parametros.sigmaV,
      gC: parametros.gC + parametros.sigmaC,
      gG: parametros.gG + parametros.sigmaG,
    }),
  };

  return {
    parametros,
    escenarios,
    ultimoRegistro,
  };
}

function proyectarEscenario({
  ultimoRegistro,
  ultimoMes,
  horizonte,
  gV,
  gC,
  gG,
}: {
  ultimoRegistro: {
    ventas: number;
    costos: number;
    gastos: number;
  };
  ultimoMes: string;
  horizonte: Horizonte;
  gV: number;
  gC: number;
  gG: number;
}): PuntoProyectado[] {
  return Array.from({ length: horizonte }).map((_, index) => {
    const h = index + 1;

    const ventas = proyectarValor(ultimoRegistro.ventas, gV, h);
    const costos = proyectarValor(ultimoRegistro.costos, gC, h);
    const gastos = proyectarValor(ultimoRegistro.gastos, gG, h);
    const beneficio = ventas - costos - gastos;

    return {
      indice: h,
      mes: sumarMeses(ultimoMes, h),
      ventas,
      costos,
      gastos,
      beneficio,
    };
  });
}

function proyectarValor(valorInicial: number, tasa: number, h: number) {
  const factor = Math.max(0, 1 + tasa);
  return valorInicial * Math.pow(factor, h);
}

function calcularTasasCrecimiento(valores: number[]) {
  const tasas: number[] = [];

  for (let i = 1; i < valores.length; i++) {
    const anterior = valores[i - 1];
    const actual = valores[i];

    if (anterior > 0) {
      tasas.push((actual - anterior) / anterior);
    }
  }

  return tasas;
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

function calcularResumenEscenario(datos: PuntoProyectado[]) {
  if (datos.length === 0) {
    return {
      ventasFinales: 0,
      costosFinales: 0,
      gastosFinales: 0,
      beneficioFinal: 0,
      beneficioAcumulado: 0,
      primerMesPerdida: null as string | null,
    };
  }

  const ultimo = datos[datos.length - 1];

  const beneficioAcumulado = datos.reduce(
    (acc, punto) => acc + punto.beneficio,
    0
  );

  const primerMesPerdida =
    datos.find((punto) => punto.beneficio < 0)?.mes ?? null;

  return {
    ventasFinales: ultimo.ventas,
    costosFinales: ultimo.costos,
    gastosFinales: ultimo.gastos,
    beneficioFinal: ultimo.beneficio,
    beneficioAcumulado,
    primerMesPerdida,
  };
}

/* =========================
   FORMATO
========================= */

function sumarMeses(fecha: string, mesesASumar: number) {
  const fechaLimpia = fecha.includes("T") ? fecha.split("T")[0] : fecha;
  const [anio, mes] = fechaLimpia.split("-").map(Number);

  const nuevaFecha = new Date(anio, mes - 1 + mesesASumar, 1);

  return new Intl.DateTimeFormat("es-MX", {
    month: "short",
    year: "2-digit",
  }).format(nuevaFecha);
}

function calcularVariacion(valorInicial: number, valorFinal: number) {
  if (!valorInicial || valorInicial === 0) return null;
  return (valorFinal - valorInicial) / valorInicial;
}

function formatoMoneda(valor: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(valor ?? 0));
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

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function obtenerCookieSupuestos(nombre: string) {
  if (typeof document === "undefined") return null;

  const valor = `; ${document.cookie}`;
  const partes = valor.split(`; ${nombre}=`);

  if (partes.length === 2) {
    return partes.pop()?.split(";").shift() ?? null;
  }

  return null;
}

function convertirMesAFechaInicioSupuestos(mes: string) {
  return `${mes}-01`;
}

function convertirMesAFechaFinSupuestos(mes: string) {
  const [anio, mesNumero] = mes.split("-").map(Number);
  const ultimoDia = new Date(anio, mesNumero, 0).getDate();

  return `${mes}-${String(ultimoDia).padStart(2, "0")}`;
}