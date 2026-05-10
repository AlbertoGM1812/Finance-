"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronDown, Database, X } from "lucide-react";
import supabase from "@/app/lib/supabase";

export type RegistroMensual = {
  registro_id: number;
  empresa_id: number;
  mes: string;
  ventas: number | string | null;
  costos: number | string | null;
  gastos: number | string | null;
  beneficio_neto: number | string | null;
};

export function useDatosSimulacion() {
  const [fechaInicio, setFechaInicio] = useState("2024-05");
  const [fechaFin, setFechaFin] = useState("2026-04");

  const [registros, setRegistros] = useState<RegistroMensual[]>([]);
  const [registrosActivos, setRegistrosActivos] = useState<Set<number>>(
    new Set()
  );

  const [modalDatosAbierto, setModalDatosAbierto] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [errorDatos, setErrorDatos] = useState<string | null>(null);

  const periodosPendientesRef = useRef<Map<number, boolean> | null>(null);

  useEffect(() => {
    cargarRegistrosPorFecha(fechaInicio, fechaFin);
  }, [fechaInicio, fechaFin]);

  async function cargarRegistrosPorFecha(
    rangoInicio = fechaInicio,
    rangoFin = fechaFin
  ) {
    try {
      setCargandoDatos(true);
      setErrorDatos(null);

      const empresaId = obtenerCookie("empresa_id");

      if (!empresaId) {
        setRegistros([]);
        setRegistrosActivos(new Set());
        setErrorDatos("No se encontró empresa_id en la cookie.");
        return;
      }

      if (rangoInicio > rangoFin) {
        setRegistros([]);
        setRegistrosActivos(new Set());
        setErrorDatos("El mes inicial no puede ser mayor que el mes final.");
        return;
      }

      const fechaInicioConsulta = convertirMesAFechaInicio(rangoInicio);
      const fechaFinConsulta = convertirMesAFechaFin(rangoFin);

      const { data, error } = await supabase
        .from("registros_mensuales")
        .select(
          "registro_id, empresa_id, mes, ventas, costos, gastos, beneficio_neto"
        )
        .eq("empresa_id", Number(empresaId))
        .gte("mes", fechaInicioConsulta)
        .lte("mes", fechaFinConsulta)
        .order("mes", { ascending: true });

      if (error) {
        throw error;
      }

      const registrosCargados = (data ?? []) as RegistroMensual[];

      setRegistros(registrosCargados);

      const periodosPendientes = periodosPendientesRef.current;

      if (periodosPendientes) {
        const idsActivos = registrosCargados
          .filter(
            (registro) =>
              periodosPendientes.get(registro.registro_id) === true
          )
          .map((registro) => registro.registro_id);

        setRegistrosActivos(new Set(idsActivos));
        periodosPendientesRef.current = null;
      } else {
        setRegistrosActivos(
          new Set(registrosCargados.map((registro) => registro.registro_id))
        );
      }
    } catch (error) {
      console.error(error);
      setErrorDatos("No se pudieron cargar los registros mensuales.");
    } finally {
      setCargandoDatos(false);
    }
  }

  function cargarSimulacionGuardada({
    fechaInicioGuardada,
    fechaFinGuardada,
    periodosTomados,
  }: {
    fechaInicioGuardada: string;
    fechaFinGuardada: string;
    periodosTomados: [number, boolean][];
  }) {
    const nuevoMesInicio = convertirFechaAMes(fechaInicioGuardada);
    const nuevoMesFin = convertirFechaAMes(fechaFinGuardada);

    periodosPendientesRef.current = new Map(
      periodosTomados.map(([registroId, activo]) => [
        Number(registroId),
        Boolean(activo),
      ])
    );

    if (nuevoMesInicio === fechaInicio && nuevoMesFin === fechaFin) {
      cargarRegistrosPorFecha(nuevoMesInicio, nuevoMesFin);
      return;
    }

    setFechaInicio(nuevoMesInicio);
    setFechaFin(nuevoMesFin);
  }

  function alternarRegistro(registroId: number) {
    setRegistrosActivos((prev) => {
      const nuevoSet = new Set(prev);

      if (nuevoSet.has(registroId)) {
        nuevoSet.delete(registroId);
      } else {
        nuevoSet.add(registroId);
      }

      return nuevoSet;
    });
  }

  function activarTodosLosRegistros() {
    setRegistrosActivos(
      new Set(registros.map((registro) => registro.registro_id))
    );
  }

  function desactivarTodosLosRegistros() {
    setRegistrosActivos(new Set());
  }

  const registrosSeleccionados = useMemo(() => {
    return registros.filter((registro) =>
      registrosActivos.has(registro.registro_id)
    );
  }, [registros, registrosActivos]);

  const registrosApagados = registros.length - registrosSeleccionados.length;

  const resumenSeleccion = useMemo(() => {
    return registrosSeleccionados.reduce(
      (acc, registro) => {
        acc.ventas += Number(registro.ventas ?? 0);
        acc.costos += Number(registro.costos ?? 0);
        acc.gastos += Number(registro.gastos ?? 0);
        acc.beneficio += Number(registro.beneficio_neto ?? 0);
        return acc;
      },
      {
        ventas: 0,
        costos: 0,
        gastos: 0,
        beneficio: 0,
      }
    );
  }, [registrosSeleccionados]);

  return {
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    registros,
    registrosActivos,
    registrosSeleccionados,
    registrosApagados,
    resumenSeleccion,
    modalDatosAbierto,
    setModalDatosAbierto,
    cargandoDatos,
    errorDatos,
    alternarRegistro,
    activarTodosLosRegistros,
    desactivarTodosLosRegistros,
    cargarSimulacionGuardada,
  };
}

export function DatosCard({
  fechaInicio,
  fechaFin,
  registros,
  registrosSeleccionados,
  registrosApagados,
  cargandoDatos,
  errorDatos,
  onClick,
}: {
  fechaInicio: string;
  fechaFin: string;
  registros: RegistroMensual[];
  registrosSeleccionados: RegistroMensual[];
  registrosApagados: number;
  cargandoDatos: boolean;
  errorDatos: string | null;
  onClick: () => void;
}) {
  const subtitle = cargandoDatos
    ? "Cargando registros..."
    : errorDatos
    ? errorDatos
    : `Rango seleccionado: ${formatoMes(fechaInicio)} a ${formatoMes(
        fechaFin
      )}`;

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Database size={34} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-blue-700">Datos</h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>

        <span className="text-xl text-slate-500">›</span>
      </div>

      <div className="mt-5 grid grid-cols-3 divide-x divide-slate-200 text-center">
        <div>
          <p className="text-xl font-bold text-[#07133b]">
            {registros.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Registros</p>
        </div>

        <div>
          <p className="text-xl font-bold text-[#07133b]">
            {registrosSeleccionados.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">Activos</p>
        </div>

        <div>
          <p className="text-xl font-bold text-[#07133b]">
            {registrosApagados}
          </p>
          <p className="mt-1 text-xs text-slate-500">Apagados</p>
        </div>
      </div>
    </button>
  );
}

export function MonthInputCard({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
      <div className="flex w-full items-center gap-4">
        <div className="text-slate-500">
          <Calendar size={24} />
        </div>

        <div className="w-full">
          <p className="text-sm text-slate-500">{label}</p>

          <input
            type="month"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="mt-1 w-full bg-transparent font-semibold text-[#07133b] outline-none"
          />
        </div>
      </div>

      <ChevronDown size={18} className="text-slate-500" />
    </div>
  );
}

export function DataSelectionModal({
  registros,
  registrosActivos,
  registrosSeleccionados,
  resumenSeleccion,
  onClose,
  onToggleRegistro,
  onActivarTodos,
  onDesactivarTodos,
}: {
  registros: RegistroMensual[];
  registrosActivos: Set<number>;
  registrosSeleccionados: RegistroMensual[];
  resumenSeleccion: {
    ventas: number;
    costos: number;
    gastos: number;
    beneficio: number;
  };
  onClose: () => void;
  onToggleRegistro: (registroId: number) => void;
  onActivarTodos: () => void;
  onDesactivarTodos: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-[#07133b]">
              Selección de datos
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Activa o desactiva los registros mensuales que se usarán en la
              simulación.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 border-b border-slate-200 p-6 md:grid-cols-4">
          <SmallMetric
            label="Registros seleccionados"
            value={String(registrosSeleccionados.length)}
          />
          <SmallMetric
            label="Ventas consideradas"
            value={formatoMoneda(resumenSeleccion.ventas)}
          />
          <SmallMetric
            label="Costos considerados"
            value={formatoMoneda(resumenSeleccion.costos)}
          />
          <SmallMetric
            label="Beneficio considerado"
            value={formatoMoneda(resumenSeleccion.beneficio)}
          />
        </div>

        <div className="flex items-center justify-between px-6 py-4">
          <p className="text-sm text-slate-500">
            Registros encontrados:{" "}
            <span className="font-semibold text-slate-800">
              {registros.length}
            </span>
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onActivarTodos}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Activar todos
            </button>

            <button
              type="button"
              onClick={onDesactivarTodos}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Apagar todos
            </button>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto px-6 pb-6">
          {registros.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
              No hay registros mensuales dentro del rango seleccionado.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Usar</th>
                    <th className="px-4 py-3">Mes</th>
                    <th className="px-4 py-3">Ventas</th>
                    <th className="px-4 py-3">Costos</th>
                    <th className="px-4 py-3">Gastos</th>
                    <th className="px-4 py-3">Beneficio neto</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {registros.map((registro) => {
                    const activo = registrosActivos.has(registro.registro_id);

                    return (
                      <tr
                        key={registro.registro_id}
                        className={
                          activo ? "bg-white" : "bg-slate-50 text-slate-400"
                        }
                      >
                        <td className="px-4 py-3">
                          <Switch
                            active={activo}
                            onClick={() =>
                              onToggleRegistro(registro.registro_id)
                            }
                          />
                        </td>

                        <td className="px-4 py-3 font-medium">
                          {formatoFechaRegistro(registro.mes)}
                        </td>

                        <td className="px-4 py-3">
                          {formatoMoneda(registro.ventas)}
                        </td>

                        <td className="px-4 py-3">
                          {formatoMoneda(registro.costos)}
                        </td>

                        <td className="px-4 py-3">
                          {formatoMoneda(registro.gastos)}
                        </td>

                        <td className="px-4 py-3">
                          {formatoMoneda(registro.beneficio_neto)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white hover:bg-blue-800"
          >
            Guardar selección
          </button>
        </div>
      </div>
    </div>
  );
}

function Switch({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-6 w-11 items-center rounded-full p-1 transition ${
        active ? "justify-end bg-blue-600" : "justify-start bg-slate-300"
      }`}
    >
      <span className="h-4 w-4 rounded-full bg-white shadow-sm" />
    </button>
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

function obtenerCookie(nombre: string) {
  if (typeof document === "undefined") return null;

  const valor = `; ${document.cookie}`;
  const partes = valor.split(`; ${nombre}=`);

  if (partes.length === 2) {
    return partes.pop()?.split(";").shift() ?? null;
  }

  return null;
}

function convertirMesAFechaInicio(mes: string) {
  return `${mes}-01`;
}

function convertirMesAFechaFin(mes: string) {
  const [anio, mesNumero] = mes.split("-").map(Number);
  const ultimoDia = new Date(anio, mesNumero, 0).getDate();

  return `${mes}-${String(ultimoDia).padStart(2, "0")}`;
}

function convertirFechaAMes(fecha: string) {
  const fechaLimpia = fecha.includes("T") ? fecha.split("T")[0] : fecha;
  return fechaLimpia.slice(0, 7);
}

function formatoMes(mes: string) {
  const fecha = new Date(`${mes}-01T00:00:00`);

  return new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(fecha);
}

function formatoFechaRegistro(fecha: string) {
  const fechaLimpia = fecha.includes("T") ? fecha.split("T")[0] : fecha;
  const fechaObjeto = new Date(`${fechaLimpia}T00:00:00`);

  return new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
  }).format(fechaObjeto);
}

function formatoMoneda(valor: number | string | null) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(Number(valor ?? 0));
}