// app/modulo1/components/registro-mes/FormularioRegistroMensual.tsx

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Cookies from 'js-cookie';
import { createRegistroMensual } from '../../utils/db';
import { useRouter } from 'next/navigation';

type RegistroData = {
  mes: string;
  ventas: string;
  costos: string;
  gastos: string;
  beneficio_neto: string;
};

const moneyFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
});

const toNumber = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const FormularioRegistroMensual = () => {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [cookieCargada, setCookieCargada] = useState(false);

  const router = useRouter();
  
  const [registroData, setRegistroData] = useState<RegistroData>({
    mes: '',
    ventas: '',
    costos: '',
    gastos: '',
    beneficio_neto: '',
  });

  const [beneficioEditadoManual, setBeneficioEditadoManual] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mensaje, setMensaje] = useState<{
    tipo: 'success' | 'error';
    texto: string;
  } | null>(null);

  useEffect(() => {
    const empresaIdCookie = Cookies.get('empresa_id') ?? null;
    setEmpresaId(empresaIdCookie);
    setCookieCargada(true);
  }, []);

  const calcularBeneficio = (ventas: string, costos: string, gastos: string) => {
    const v = toNumber(ventas);
    const c = toNumber(costos);
    const g = toNumber(gastos);

    return v - c - g;
  };

  const margenNeto = useMemo(() => {
    const ventas = toNumber(registroData.ventas);
    const beneficio = toNumber(registroData.beneficio_neto);

    if (ventas === 0) return 0;

    return beneficio / ventas;
  }, [registroData.ventas, registroData.beneficio_neto]);

  const estadoFinanciero = useMemo(() => {
    const beneficio = toNumber(registroData.beneficio_neto);

    if (beneficio > 0) {
      return {
        texto: 'Rentable',
        descripcion: 'Las ventas cubren costos y gastos.',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      };
    }

    if (beneficio === 0) {
      return {
        texto: 'En equilibrio',
        descripcion: 'Las ventas apenas cubren costos y gastos.',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    }

    return {
      texto: 'En pérdida',
      descripcion: 'Los costos y gastos superan las ventas.',
      className: 'bg-red-50 text-red-700 border-red-200',
    };
  }, [registroData.beneficio_neto]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setMensaje(null);

    if (name === 'beneficio_neto') {
      setBeneficioEditadoManual(true);

      setRegistroData((prev) => ({
        ...prev,
        beneficio_neto: value,
      }));

      return;
    }

    setRegistroData((prev) => {
      const nuevoRegistro = {
        ...prev,
        [name]: value,
      };

      const debeRecalcular =
        ['ventas', 'costos', 'gastos'].includes(name) && !beneficioEditadoManual;

      if (debeRecalcular) {
        const nuevoBeneficio = calcularBeneficio(
          nuevoRegistro.ventas,
          nuevoRegistro.costos,
          nuevoRegistro.gastos
        );

        nuevoRegistro.beneficio_neto = String(nuevoBeneficio);
      }

      return nuevoRegistro;
    });
  };

  const recalcularBeneficio = () => {
    const nuevoBeneficio = calcularBeneficio(
      registroData.ventas,
      registroData.costos,
      registroData.gastos
    );

    setRegistroData((prev) => ({
      ...prev,
      beneficio_neto: String(nuevoBeneficio),
    }));

    setBeneficioEditadoManual(false);
  };

  const limpiarFormulario = () => {
    setRegistroData({
      mes: '',
      ventas: '',
      costos: '',
      gastos: '',
      beneficio_neto: '',
    });

    setBeneficioEditadoManual(false);
    setMensaje(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje(null);

    if (!cookieCargada) {
      setMensaje({
        tipo: 'error',
        texto: 'Espera un momento. Aún se está cargando la empresa activa.',
      });
      return;
    }

    if (!empresaId) {
      setMensaje({
        tipo: 'error',
        texto: 'No se ha encontrado la empresa activa. Registra una empresa primero.',
      });
      return;
    }

    if (!registroData.mes) {
      setMensaje({
        tipo: 'error',
        texto: 'Selecciona el mes del registro.',
      });
      return;
    }

    const fechaCompleta = `${registroData.mes}-01`;

    const payload = {
      mes: fechaCompleta,
      ventas: toNumber(registroData.ventas),
      costos: toNumber(registroData.costos),
      gastos: toNumber(registroData.gastos),
      beneficio_neto: toNumber(registroData.beneficio_neto),
    };

    try {
      setIsSubmitting(true);

      const response = await createRegistroMensual(empresaId, payload);

      console.log('Respuesta del servidor:', response);

      if (response) {
  setMensaje({
    tipo: 'success',
    texto: 'Registro mensual guardado con éxito. Redirigiendo al dashboard...',
  });

  limpiarFormulario();

  router.push('/modulo1/dashboard');
} else {
  setMensaje({
    tipo: 'error',
    texto: 'Hubo un error al guardar el registro mensual.',
  });
}
    } catch (error) {
      console.error('Error en la solicitud:', error);

      setMensaje({
        tipo: 'error',
        texto: 'Hubo un error al guardar el registro mensual.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-600">
              Módulo 1
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
              Registro mensual
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              Captura ventas, costos y gastos del mes. El beneficio neto se
              calcula automáticamente, pero puedes editarlo manualmente si
              necesitas hacer un ajuste contable.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Empresa activa
            </p>

            <p className="mt-1 text-lg font-semibold text-slate-950">
              {!cookieCargada
                ? 'Cargando...'
                : empresaId
                ? `ID ${empresaId}`
                : 'No detectada'}
            </p>
          </div>
        </div>

        {mensaje && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm ${
              mensaje.tipo === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-red-200 bg-red-50 text-red-700'
            }`}
          >
            {mensaje.texto}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="mb-6 flex items-center justify-between border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-950">
                  Datos del mes
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Registra la información financiera mensual.
                </p>
              </div>

              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${estadoFinanciero.className}`}
              >
                {estadoFinanciero.texto}
              </span>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="mes"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Mes del registro
                </label>

                <input
                  type="month"
                  id="mes"
                  name="mes"
                  value={registroData.mes}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="ventas"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Ventas
                </label>

                <input
                  type="number"
                  id="ventas"
                  name="ventas"
                  min="0"
                  step="0.01"
                  value={registroData.ventas}
                  onChange={handleChange}
                  required
                  placeholder="Ej. 25000"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="costos"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Costos
                </label>

                <input
                  type="number"
                  id="costos"
                  name="costos"
                  min="0"
                  step="0.01"
                  value={registroData.costos}
                  onChange={handleChange}
                  required
                  placeholder="Ej. 12000"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="gastos"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Gastos
                </label>

                <input
                  type="number"
                  id="gastos"
                  name="gastos"
                  min="0"
                  step="0.01"
                  value={registroData.gastos}
                  onChange={handleChange}
                  required
                  placeholder="Ej. 6000"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <label
                    htmlFor="beneficio_neto"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Beneficio neto
                  </label>

                  {beneficioEditadoManual && (
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-700">
                      Editado manualmente
                    </span>
                  )}
                </div>

                <input
                  type="number"
                  id="beneficio_neto"
                  name="beneficio_neto"
                  step="0.01"
                  value={registroData.beneficio_neto}
                  onChange={handleChange}
                  required
                  placeholder="Se calcula automáticamente"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />

                <button
                  type="button"
                  onClick={recalcularBeneficio}
                  className="mt-2 text-xs font-semibold text-cyan-600 transition hover:text-cyan-700"
                >
                  Recalcular con ventas - costos - gastos
                </button>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-2xl bg-cyan-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar registro'}
              </button>

              <button
                type="button"
                onClick={limpiarFormulario}
                className="rounded-2xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
              >
                Limpiar
              </button>
            </div>
          </form>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                Resultado del mes
              </p>

              <h2 className="mt-3 text-3xl font-bold text-slate-950">
                {moneyFormatter.format(toNumber(registroData.beneficio_neto))}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Beneficio neto registrado para el mes seleccionado.
              </p>

              <div
                className={`mt-5 rounded-2xl border px-4 py-3 ${estadoFinanciero.className}`}
              >
                <p className="text-sm font-semibold">{estadoFinanciero.texto}</p>

                <p className="mt-1 text-xs opacity-90">
                  {estadoFinanciero.descripcion}
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Margen neto
              </p>

              <p className="mt-4 text-4xl font-bold text-slate-950">
                {(margenNeto * 100).toFixed(2)}%
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Porcentaje de las ventas que queda como beneficio neto.
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Interpretación
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {margenNeto > 0
                    ? `Por cada $100 de ventas, la empresa conserva aproximadamente $${(
                        margenNeto * 100
                      ).toFixed(2)} como beneficio neto.`
                    : margenNeto === 0
                    ? 'La empresa está en punto neutral: no genera utilidad, pero tampoco pérdida.'
                    : `Por cada $100 de ventas, la empresa pierde aproximadamente $${Math.abs(
                        margenNeto * 100
                      ).toFixed(2)}.`}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
};

export default FormularioRegistroMensual;