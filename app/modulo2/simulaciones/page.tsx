"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  CalendarRange,
  ExternalLink,
  FolderOpen,
  Loader2,
  PlusCircle,
  RefreshCcw,
  Search,
} from "lucide-react";

import supabase from "@/app/lib/supabase";

type SimulacionGuardada = {
  simulacion_id: number;
  empresa_id: number;
  nombre_simulacion: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  periodos_tomados: string | null;
};

type PeriodoTomado = [number, boolean];

export default function MenuSimulacionesPage() {
  const [simulaciones, setSimulaciones] = useState<SimulacionGuardada[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarSimulaciones();
  }, []);

  async function cargarSimulaciones() {
    try {
      setCargando(true);
      setError(null);

      const empresaId = obtenerCookie("empresa_id");

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

  const simulacionesFiltradas = useMemo(() => {
    return simulaciones.filter((simulacion) => {
      const texto = `${simulacion.nombre_simulacion} ${
        simulacion.descripcion ?? ""
      }`.toLowerCase();

      return texto.includes(busqueda.toLowerCase());
    });
  }, [simulaciones, busqueda]);

  return (
    <main className="min-h-screen bg-[#f7f9fc] px-8 py-6 text-slate-900">
      <section className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Link
            href="/modulo1/dashboard"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            <ArrowLeft size={18} />
            Volver al dashboard
          </Link>

          <h1 className="text-4xl font-bold tracking-tight text-[#07133b]">
            Simulaciones guardadas
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Selecciona una simulación para abrirla y continuar trabajando sobre
            ella.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
  <Link
    href="/modulo2"
    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-800"
  >
    <PlusCircle size={18} />
    Nueva simulación
  </Link>

  <button
    type="button"
    onClick={cargarSimulaciones}
    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
  >
    <RefreshCcw size={18} />
    Recargar
  </button>
</div>
      </section>

      <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
          <Search size={20} className="text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="w-full bg-transparent text-sm text-slate-700 outline-none"
          />
        </div>
      </section>

      {cargando && (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-10 text-slate-500 shadow-sm">
          <Loader2 size={22} className="animate-spin" />
          Cargando simulaciones...
        </div>
      )}

      {error && !cargando && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} />
            <div>
              <h2 className="font-bold">Error al cargar simulaciones</h2>
              <p className="mt-1 text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

     {!cargando && !error && simulacionesFiltradas.length === 0 && (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm">
    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
      <PlusCircle size={32} />
    </div>

    <h2 className="text-xl font-bold text-[#07133b]">
      No hay simulaciones guardadas
    </h2>

    <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
      Crea una nueva simulación para proyectar ventas, costos, gastos y beneficio
      neto de la empresa activa.
    </p>

    <Link
      href="/modulo2"
      className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
    >
      <PlusCircle size={18} />
      Crear nueva simulación
    </Link>
  </div>
)}

      {!cargando && !error && simulacionesFiltradas.length > 0 && (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {simulacionesFiltradas.map((simulacion) => {
            const periodosTomados = parsearPeriodosTomados(
              simulacion.periodos_tomados
            );

            const totalPeriodos = periodosTomados.length;
            const periodosActivos = periodosTomados.filter(
              ([, activo]) => activo
            ).length;

            return (
              <article
                key={simulacion.simulacion_id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-5 flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                    <FolderOpen size={28} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold text-[#07133b]">
                      {simulacion.nombre_simulacion}
                    </h2>

                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                      {simulacion.descripcion || "Sin descripción"}
                    </p>
                  </div>
                </div>

                <div className="mb-5 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <CalendarRange size={18} />
                  <span>
                    {formatoFechaCorta(simulacion.fecha_inicio)} -{" "}
                    {formatoFechaCorta(simulacion.fecha_fin)}
                  </span>
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3">
                  <SmallMetric label="Periodos" value={String(totalPeriodos)} />
                  <SmallMetric label="Activos" value={String(periodosActivos)} />
                </div>

                <Link
                  href={`/modulo2?simulacion_id=${simulacion.simulacion_id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-4 font-semibold text-white transition hover:bg-blue-800"
                >
                  Abrir simulación
                  <ExternalLink size={18} />
                </Link>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#07133b]">{value}</p>
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

function obtenerCookie(nombre: string) {
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