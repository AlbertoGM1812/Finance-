"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Dice5, FolderOpen } from "lucide-react";

import supabase from "@/app/lib/supabase";

import {
  DataSelectionModal,
  DatosCard,
  MonthInputCard,
  useDatosSimulacion,
} from "./funciones_datos";

import {
  PanelControlSupuestos,
  PronosticoDeterminista,
  useSupuestosDeterministas,
} from "./funciones_supuesto";

import { MonteCarloEstandar } from "./funciones_MC";
import { MonteCarloExtendido } from "./funciones_MC_extendido";

import {
  SimulacionesGuardadasPanel,
  type PeriodoTomado,
  type SimulacionGuardada,
} from "./funciones_simulaciones_guardadas";

export default function Modulo2Page() {
  const datos = useDatosSimulacion();
  const supuestos = useSupuestosDeterministas(datos.registrosSeleccionados);

  const [nombreSimulacion, setNombreSimulacion] = useState(
    "Simulación financiera"
  );

  const [descripcionSimulacion, setDescripcionSimulacion] = useState(
    "Explora escenarios y proyecta el comportamiento de tu negocio"
  );

  const [simulacionActivaId, setSimulacionActivaId] = useState<number | null>(
    null
  );

  const [refreshSimulacionesKey, setRefreshSimulacionesKey] = useState(0);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const simulacionIdUrl = searchParams.get("simulacion_id");

    if (!simulacionIdUrl) return;

    const simulacionId = Number(simulacionIdUrl);

    if (!Number.isFinite(simulacionId)) return;

    cargarSimulacionDesdeUrl(simulacionId);
  }, []);

  async function cargarSimulacionDesdeUrl(simulacionId: number) {
    try {
      const empresaId = obtenerCookiePage("empresa_id");

      if (!empresaId) {
        console.error("No se encontró empresa_id en la cookie.");
        return;
      }

      const { data, error } = await supabase
        .from("simulaciones")
        .select(
          "simulacion_id, empresa_id, nombre_simulacion, descripcion, fecha_inicio, fecha_fin, periodos_tomados"
        )
        .eq("simulacion_id", simulacionId)
        .eq("empresa_id", Number(empresaId))
        .single();

      if (error) {
        throw error;
      }

      setSimulacionActivaId(data.simulacion_id);
      setNombreSimulacion(data.nombre_simulacion);
      setDescripcionSimulacion(data.descripcion ?? "");

      datos.cargarSimulacionGuardada({
        fechaInicioGuardada: data.fecha_inicio,
        fechaFinGuardada: data.fecha_fin,
        periodosTomados: parsearPeriodosTomadosPage(data.periodos_tomados),
      });
    } catch (error) {
      console.error("No se pudo cargar la simulación desde la URL:", error);
    }
  }

  function cargarSimulacionGuardada(
    simulacion: SimulacionGuardada,
    periodosTomados: PeriodoTomado[]
  ) {
    setSimulacionActivaId(simulacion.simulacion_id);
    setNombreSimulacion(simulacion.nombre_simulacion);
    setDescripcionSimulacion(simulacion.descripcion ?? "");

    datos.cargarSimulacionGuardada({
      fechaInicioGuardada: simulacion.fecha_inicio,
      fechaFinGuardada: simulacion.fecha_fin,
      periodosTomados,
    });
  }

  function irASeccionMonteCarlo() {
    document
      .getElementById("monte-carlo-section")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-8 py-6 text-slate-900">
      <section className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
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
        </div>

        <Link
          href="/modulo2/simulaciones"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
        >
          <FolderOpen size={18} />
          Ver simulaciones
        </Link>
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

          <div id="simulaciones-guardadas">
            <SimulacionesGuardadasPanel
              simulacionActivaId={simulacionActivaId}
              refreshKey={refreshSimulacionesKey}
              onCargarSimulacion={cargarSimulacionGuardada}
            />
          </div>

          <PanelControlSupuestos
            supuestos={supuestos}
            nombreSimulacion={nombreSimulacion}
            descripcionSimulacion={descripcionSimulacion}
            fechaInicio={datos.fechaInicio}
            fechaFin={datos.fechaFin}
            registros={datos.registros}
            registrosActivos={datos.registrosActivos}
            simulacionIdActiva={simulacionActivaId}
            setSimulacionIdActiva={setSimulacionActivaId}
            onSimulacionGuardada={() =>
              setRefreshSimulacionesKey((prev) => prev + 1)
            }
          />
        </aside>
      </section>

      <section id="monte-carlo-section" className="mt-6">
        <MonteCarloEstandar
          registrosSeleccionados={datos.registrosSeleccionados}
        />
      </section>

      <section id="monte-carlo-extendido-section" className="mt-6">
        <MonteCarloExtendido
          registrosSeleccionados={datos.registrosSeleccionados}
        />
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

function obtenerCookiePage(nombre: string) {
  if (typeof document === "undefined") return null;

  const valor = `; ${document.cookie}`;
  const partes = valor.split(`; ${nombre}=`);

  if (partes.length === 2) {
    return partes.pop()?.split(";").shift() ?? null;
  }

  return null;
}

function parsearPeriodosTomadosPage(valor: string | null): [number, boolean][] {
  if (!valor) return [];

  try {
    const parsed = JSON.parse(valor);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => Array.isArray(item) && item.length >= 2)
      .map((item) => [Number(item[0]), Boolean(item[1])] as [number, boolean])
      .filter(([registroId]) => Number.isFinite(registroId));
  } catch {
    return [];
  }
}