"use client";

import {
  PanelControlSupuestos,
  PronosticoDeterminista,
  useSupuestosDeterministas,
} from "./funciones_supuesto";

import React, { useState } from "react";

import { MonteCarloEstandar } from "./funciones_MC";

import {
  ChevronDown,
  MoreVertical,
  Dice5,
  Play,
  RotateCcw,
  Save,
  TrendingUp,
} from "lucide-react";

import {
  DataSelectionModal,
  DatosCard,
  MonthInputCard,
  useDatosSimulacion,
} from "./funciones_datos";

export default function Modulo2Page() {
  const datos = useDatosSimulacion();
const supuestos = useSupuestosDeterministas(datos.registrosSeleccionados);

const [nombreSimulacion, setNombreSimulacion] = useState(
  "Simulación financiera"
);

const [descripcionSimulacion, setDescripcionSimulacion] = useState(
  "Explora escenarios y proyecta el comportamiento de tu negocio"
);

function irASeccionMonteCarlo() {
  document
    .getElementById("monte-carlo-section")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}


  return (
    <main className="min-h-screen bg-[#f7f9fc] px-8 py-6 text-slate-900">
      <section className="mb-6">
  <input
    type="text"
    value={nombreSimulacion}
    onChange={(event) => setNombreSimulacion(event.target.value)}
    className="w-full bg-transparent text-4xl font-bold tracking-tight text-[#07133b] outline-none"
    placeholder="Nombre de la simulación"
  />

  <textarea
    value={descripcionSimulacion}
    onChange={(event) => setDescripcionSimulacion(event.target.value)}
    className="mt-2 w-full resize-none bg-transparent text-sm text-slate-500 outline-none"
    rows={1}
    placeholder="Descripción de la simulación"
  />
</section>

      <section className="grid grid-cols-12 gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <DatosCard
              fechaInicio={datos.fechaInicio}
              fechaFin={datos.fechaFin}
              registros={datos.registros}
              registrosSeleccionados={datos.registrosSeleccionados}
              registrosApagados={datos.registrosApagados}
              cargandoDatos={datos.cargandoDatos}
              errorDatos={datos.errorDatos}
              onClick={() => datos.setModalDatosAbierto(true)}
            />

<SummaryCard
  icon={<Dice5 size={34} />}
  title="Monte Carlo"
  subtitle="Simulación probabilística de escenarios"
  color="teal"
  onClick={irASeccionMonteCarlo}
  items={[
    { value: "MC", label: "Modelo" },
    { value: "N", label: "Iteraciones" },
    { value: "σ", label: "Riesgo" },
  ]}
/>
          </div>

<PronosticoDeterminista supuestos={supuestos} />


        </div>

        <aside className="col-span-12 space-y-6 xl:col-span-4">
          <MonthInputCard
            label="Mes inicio"
            value={datos.fechaInicio}
            onChange={datos.setFechaInicio}
          />

          <MonthInputCard
            label="Mes fin"
            value={datos.fechaFin}
            onChange={datos.setFechaFin}
          />

          <PanelControlSupuestos
  supuestos={supuestos}
  nombreSimulacion={nombreSimulacion}
  descripcionSimulacion={descripcionSimulacion}
  fechaInicio={datos.fechaInicio}
  fechaFin={datos.fechaFin}
  registros={datos.registros}
  registrosActivos={datos.registrosActivos}
/>
        </aside>
      </section>

      <section id="monte-carlo-section" className="mt-6">
  <MonteCarloEstandar registrosSeleccionados={datos.registrosSeleccionados} />
</section>

      {datos.modalDatosAbierto && (
        <DataSelectionModal
          registros={datos.registros}
          registrosActivos={datos.registrosActivos}
          registrosSeleccionados={datos.registrosSeleccionados}
          resumenSeleccion={datos.resumenSeleccion}
          onClose={() => datos.setModalDatosAbierto(false)}
          onToggleRegistro={datos.alternarRegistro}
          onActivarTodos={datos.activarTodosLosRegistros}
          onDesactivarTodos={datos.desactivarTodosLosRegistros}
        />
      )}
    </main>
  );
}

function SummaryCard({
  icon,
  title,
  subtitle,
  color,
  items,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: "blue" | "teal";
  items: { value: string; label: string }[];
  onClick?: () => void;
}) {
  const colorClasses =
    color === "blue"
      ? "bg-blue-50 text-blue-600"
      : "bg-teal-50 text-teal-700";

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div
            className={`flex h-20 w-20 items-center justify-center rounded-2xl ${colorClasses}`}
          >
            {icon}
          </div>

          <div>
            <h2
              className={`text-lg font-bold ${
                color === "blue" ? "text-blue-700" : "text-teal-700"
              }`}
            >
              {title}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        <span className="text-xl text-slate-500">›</span>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 text-center">
        {items.map((item) => (
          <div key={item.label}>
            <p className="text-xl font-bold text-[#07133b]">{item.value}</p>
            <p className="mt-1 text-xs text-slate-500">{item.label}</p>
          </div>
        ))}
      </div>
    </button>
  );
}

function ChartCard({
  title,
  subtitle,
  type,
}: {
  title: string;
  subtitle: string;
  type: "line" | "bar";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#07133b]">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-lg border border-slate-200 text-sm">
            <button className="px-4 py-2 text-slate-500">6M</button>
            <button className="border-l border-slate-200 px-4 py-2 text-slate-500">
              12M
            </button>
            <button className="border-l border-slate-200 bg-blue-50 px-4 py-2 font-medium text-blue-700">
              24M
            </button>
          </div>

          {type === "line" ? (
            <MoreVertical size={20} className="text-slate-600" />
          ) : (
            <Save size={20} className="text-slate-600" />
          )}
        </div>
      </div>

      <div className="relative h-64 rounded-xl bg-white">
        <div className="absolute inset-0 flex flex-col justify-between py-4">
          {[1, 2, 3, 4, 5].map((line) => (
            <div
              key={line}
              className="border-t border-dashed border-slate-200"
            />
          ))}
        </div>

        {type === "line" ? <LineChartPlaceholder /> : <BarChartPlaceholder />}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <MetricBox
          label={type === "line" ? "Ventas (24M)" : "Beneficio neto (24M)"}
          value={type === "line" ? "$31.2 M" : "$11.1 M"}
        />
        <MetricBox
          label={type === "line" ? "Costos (24M)" : "Margen neto prom."}
          value={type === "line" ? "$20.1 M" : "14.2%"}
        />
        <MetricBox
          label={type === "line" ? "Gastos (24M)" : "Punto de equilibrio"}
          value={type === "line" ? "$7.8 M" : "Jul '24"}
        />
      </div>
    </div>
  );
}

function LineChartPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-end px-6 pb-8">
      <div className="relative h-full w-full">
        <div className="absolute bottom-4 left-0 h-[2px] w-full rotate-[-7deg] rounded-full bg-blue-600" />
        <div className="absolute bottom-12 left-0 h-[2px] w-full rotate-[-5deg] rounded-full bg-teal-600" />
        <div className="absolute bottom-24 left-0 h-[2px] w-full rotate-[-3deg] rounded-full bg-violet-600" />

        <div className="absolute left-1/3 top-2 flex gap-8 text-xs text-slate-600">
          <span className="text-blue-600">— Ventas</span>
          <span className="text-teal-600">— Costos</span>
          <span className="text-violet-600">— Gastos</span>
        </div>
      </div>
    </div>
  );
}

function BarChartPlaceholder() {
  const bars = [
    30, 28, 25, 22, 20, 18, 15, 12, 18, 22, 28, 34, 40, 42, 45, 48, 52, 58,
    64, 68, 72, 78, 84, 88,
  ];

  return (
    <div className="absolute inset-0 flex items-end gap-2 px-6 pb-8">
      {bars.map((height, index) => (
        <div
          key={index}
          className="w-full rounded-t-md bg-blue-600"
          style={{ height: `${height}%` }}
        />
      ))}
    </div>
  );
}

function MetricBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-[#07133b]">{value}</p>
    </div>
  );
}

function ControlPanel() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-[#07133b]">Panel de control</h2>

        <button className="flex items-center gap-2 text-sm font-medium text-[#07133b]">
          <RotateCcw size={16} />
          Restablecer
        </button>
      </div>

      <div className="space-y-5">
        <SelectPlaceholder label="Horizonte de proyección" value="24 meses" />

        <SliderPlaceholder label="Crecimiento de ventas anual" value="8.0 %" />
        <SliderPlaceholder label="Inflación anual" value="4.25 %" />
        <SliderPlaceholder label="Volatilidad" value="10.0 %" />

        <SelectPlaceholder label="Escenario" value="Escenario base" />

        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-600">
            Incluir impuestos
          </p>
          <div className="flex h-6 w-11 items-center justify-end rounded-full bg-blue-600 p-1">
            <div className="h-4 w-4 rounded-full bg-white" />
          </div>
        </div>

        <SelectPlaceholder label="Moneda" value="MXN - Peso Mexicano" />

        <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-4 font-semibold text-white shadow-sm transition hover:bg-blue-800">
          <Play size={18} fill="white" />
          Ejecutar simulación
        </button>

        <button className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 font-semibold text-blue-700 transition hover:bg-blue-50">
          <Save size={18} />
          Guardar escenario
        </button>
      </div>
    </div>
  );
}

function SelectPlaceholder({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-600">
        {label}
      </label>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
        <span>{value}</span>
        <ChevronDown size={16} />
      </div>
    </div>
  );
}

function SliderPlaceholder({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-600">{label}</label>
        <span className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
          {value}
        </span>
      </div>

      <div className="h-2 rounded-full bg-slate-200">
        <div className="h-2 w-1/2 rounded-full bg-blue-600" />
      </div>

      <div className="mt-1 flex justify-between text-xs text-slate-500">
        <span>0%</span>
        <span>20%</span>
      </div>
    </div>
  );
}