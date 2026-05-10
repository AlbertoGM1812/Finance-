"use client";

import React, { useEffect, useState } from "react";
import {
  CalendarRange,
  FolderOpen,
  Loader2,
  RefreshCcw,
  Search,
} from "lucide-react";

import supabase from "@/app/lib/supabase";

export type PeriodoTomado = [number, boolean];

export type SimulacionGuardada = {
  simulacion_id: number;
  empresa_id: number;
  nombre_simulacion: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  periodos_tomados: string | null;
};

export function SimulacionesGuardadasPanel({
  simulacionActivaId,
  refreshKey,
  onCargarSimulacion,
}: {
  simulacionActivaId: number | null;
  refreshKey: number;
  onCargarSimulacion: (
    simulacion: SimulacionGuardada,
    periodosTomados: PeriodoTomado[]
  ) => void;
}) {
  const [simulaciones, setSimulaciones] = useState<SimulacionGuardada[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarSimulacionesGuardadas();
  }, [refreshKey]);

  async function cargarSimulacionesGuardadas() {
    try {
      setCargando(true);
      setError(null);

      const empresaId = obtenerCookieSimulaciones("empresa_id");

      if (!empresaId) {
        setSimulaciones([]);
        setError("No se encontró empresa_id en la cookie.");
        return;
      }

      const { data, error } = await supabase
        .from("simulaciones")
        .select(
          "simulacion_id, empresa_id, nombre_simulacion, descripcion, fecha_inicio, fecha_fin, periodos_tomados"
        )
        .eq("empresa_id", Number(empresaId))
        .order("simulacion_id", { ascending: false });

      if (error) {
        throw error;
      }

      setSimulaciones((data ?? []) as SimulacionGuardada[]);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar las simulaciones guardadas.");
    } finally {
      setCargando(false);
    }
  }

  const simulacionesFiltradas = simulaciones.filter((simulacion) => {
    const texto = `${simulacion.nombre_simulacion} ${
      simulacion.descripcion ?? ""
    }`.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#07133b]">
            Simulaciones guardadas
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Carga una simulación para continuar trabajando sobre ella.
          </p>
        </div>

        <button
          type="button"
          onClick={cargarSimulacionesGuardadas}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
          title="Recargar simulaciones"
        >
          <RefreshCcw size={18} />
        </button>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          placeholder="Buscar simulación..."
          className="w-full bg-transparent text-sm text-slate-700 outline-none"
        />
      </div>

      {cargando && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          <Loader2 size={18} className="animate-spin" />
          Cargando simulaciones...
        </div>
      )}

      {error && !cargando && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {!cargando && !error && simulacionesFiltradas.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500">
          No hay simulaciones guardadas para esta empresa.
        </div>
      )}

      {!cargando && !error && simulacionesFiltradas.length > 0 && (
        <div className="max-h-[360px] space-y-3 overflow-y-auto pr-1">
          {simulacionesFiltradas.map((simulacion) => {
            const activa = simulacion.simulacion_id === simulacionActivaId;
            const periodosTomados = parsearPeriodosTomados(
              simulacion.periodos_tomados
            );

            const activos = periodosTomados.filter(([, activo]) => activo)
              .length;

            const totalPeriodos = periodosTomados.length;

            return (
              <button
                key={simulacion.simulacion_id}
                type="button"
                onClick={() => onCargarSimulacion(simulacion, periodosTomados)}
                className={`w-full rounded-2xl border p-4 text-left transition hover:shadow-sm ${
                  activa
                    ? "border-blue-300 bg-blue-50"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      activa
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    <FolderOpen size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate font-bold text-[#07133b]">
                        {simulacion.nombre_simulacion}
                      </h3>

                      {activa && (
                        <span className="rounded-full bg-blue-700 px-2 py-1 text-[10px] font-bold uppercase text-white">
                          Activa
                        </span>
                      )}
                    </div>

                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                      {simulacion.descripcion || "Sin descripción"}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <CalendarRange size={14} />
                      <span>
                        {formatoFechaCorta(simulacion.fecha_inicio)} -{" "}
                        {formatoFechaCorta(simulacion.fecha_fin)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-slate-400">Periodos</p>
                        <p className="font-bold text-[#07133b]">
                          {totalPeriodos}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-50 px-3 py-2">
                        <p className="text-slate-400">Activos</p>
                        <p className="font-bold text-[#07133b]">{activos}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function parsearPeriodosTomados(valor: string | null): PeriodoTomado[] {
  if (!valor) return [];

  try {
    const parsed = JSON.parse(valor);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => Array.isArray(item) && item.length >= 2)
      .map((item) => [Number(item[0]), Boolean(item[1])] as PeriodoTomado)
      .filter(([registroId]) => Number.isFinite(registroId));
  } catch {
    return [];
  }
}

function obtenerCookieSimulaciones(nombre: string) {
  if (typeof document === "undefined") return null;

  const valor = `; ${document.cookie}`;
  const partes = valor.split(`; ${nombre}=`);

  if (partes.length === 2) {
    return partes.pop()?.split(";").shift() ?? null;
  }

  return null;
}

function formatoFechaCorta(fecha: string) {
  const fechaLimpia = fecha.includes("T") ? fecha.split("T")[0] : fecha;
  const fechaObjeto = new Date(`${fechaLimpia}T00:00:00`);

  return new Intl.DateTimeFormat("es-MX", {
    month: "short",
    year: "numeric",
  }).format(fechaObjeto);
}