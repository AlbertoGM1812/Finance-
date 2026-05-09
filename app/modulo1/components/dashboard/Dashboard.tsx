"use client";

import React, { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  getRegistrosMensualesByEmpresa,
  getEmpresaById,
} from "../../utils/db";


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type RegistroMensual = {
  registro_id: number;
  empresa_id: number;
  mes: string;
  ventas: number | string;
  costos: number | string;
  gastos: number | string;
  beneficio_neto: number | string;
  created_at?: string;
};

type Empresa = {
  empresa_id: number;
  nombre: string;
  rfc: string;
  fecha_creacion: string;
  sector: string;
  direccion: string;
};

const Dashboard = () => {
  const router = useRouter();

  const [registros, setRegistros] = useState<RegistroMensual[]>([]);
  const [loading, setLoading] = useState(true);
  const [empresaId, setEmpresaId] = useState<string | undefined>(undefined);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  useEffect(() => {
  const empresaCookie = Cookies.get("empresa_id");
  setEmpresaId(empresaCookie);

  if (!empresaCookie) {
    setLoading(false);
    return;
  }

  const fetchData = async () => {
    const empresaData = await getEmpresaById(empresaCookie);
    const registrosData = await getRegistrosMensualesByEmpresa(empresaCookie);

    setEmpresa(empresaData);
    setRegistros(registrosData || []);
    setLoading(false);
  };

  fetchData();
}, []);

  const formatCurrency = (value: number | string) => {
    const numberValue = Number(value);

    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(numberValue);
  };

  const formatMonth = (dateString: string) => {
    const date = new Date(dateString);

    return date.toLocaleDateString("es-MX", {
      year: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  };

  const labels = registros.map((registro) => formatMonth(registro.mes));

  const ventas = registros.map((registro) => Number(registro.ventas));
  const costos = registros.map((registro) => Number(registro.costos));
  const gastos = registros.map((registro) => Number(registro.gastos));
  const beneficioNeto = registros.map((registro) =>
    Number(registro.beneficio_neto)
  );

  const tasasCrecimiento = beneficioNeto.map((beneficioActual, index) => {
    if (index === 0) return null;

    const beneficioAnterior = beneficioNeto[index - 1];

    if (beneficioAnterior === 0) return null;

    return ((beneficioActual - beneficioAnterior) / Math.abs(beneficioAnterior)) * 100;
  });

  const tasasValidas = tasasCrecimiento.filter(
    (tasa): tasa is number => tasa !== null && Number.isFinite(tasa)
  );

  const tasaCrecimientoPromedio =
    tasasValidas.length > 0
      ? tasasValidas.reduce((acc, tasa) => acc + tasa, 0) / tasasValidas.length
      : 0;

  const obtenerTendencia = () => {
    if (registros.length < 2) return "Sin datos suficientes";

    if (tasaCrecimientoPromedio >= 8) return "En expansión";
    if (tasaCrecimientoPromedio >= 0) return "Estable";

    return "En peligro";
  };

  const tendencia = obtenerTendencia();

  const handleSalir = () => {
    Cookies.remove("empresa_id");
    router.push("/modulo1");
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            return `${context.dataset.label}: ${formatCurrency(
              context.parsed.y
            )}`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function (value) {
            return `$${Number(value).toLocaleString("es-MX")}`;
          },
        },
      },
    },
  };

  const datosOperacionChart = {
    labels,
    datasets: [
      {
        label: "Ventas",
        data: ventas,
        tension: 0.3,
      },
      {
        label: "Costos",
        data: costos,
        tension: 0.3,
      },
      {
        label: "Gastos",
        data: gastos,
        tension: 0.3,
      },
    ],
  };

  const beneficioChart = {
    labels,
    datasets: [
      {
        label: "Beneficio neto",
        data: beneficioNeto,
        tension: 0.3,
      },
    ],
  };

  if (loading) {
    return (
      <main className="dashboard-page">
        <p>Cargando dashboard...</p>
      </main>
    );
  }

  if (!empresaId) {
    return (
      <main className="dashboard-page">
        <div className="dashboard-empty">
          <h1>No hay empresa activa</h1>
          <p>
            Primero registra una empresa para poder visualizar su dashboard.
          </p>
          <button
            className="dashboard-button primary"
            onClick={() => router.push("/modulo1")}
          >
            Registrar empresa
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <nav className="dashboard-navbar">
        <div>
          <h1>Dashboard financiero</h1>
          <p>
  {empresa
    ? `${empresa.nombre} | ID: ${empresa.empresa_id}`
    : `Empresa activa | ID: ${empresaId}`}
</p>
        </div>

        <div className="dashboard-nav-actions">
          <button
            className="dashboard-button primary"
            onClick={() => router.push("/modulo1/registro-mes")}
          >
            Registrar nuevo mes
          </button>

          <button
            className="dashboard-button secondary"
            onClick={() => router.push("/modulo1/centro-simulacion")}
          >
            Centro de simulación
          </button>

          <button className="dashboard-button danger" onClick={handleSalir}>
            Salir
          </button>
        </div>
      </nav>

      {registros.length === 0 ? (
        <section className="dashboard-empty">
          <h2>No hay registros mensuales todavía</h2>
          <p>
            Agrega el primer registro mensual para comenzar a visualizar las
            gráficas.
          </p>
          <button
            className="dashboard-button primary"
            onClick={() => router.push("/modulo1/registro-mes")}
          >
            Registrar nuevo mes
          </button>
        </section>
      ) : (
        <>
          <section className="dashboard-grid">
            <div className="dashboard-card chart-card">
              <h2>Ventas, costos y gastos por mes</h2>
              <div className="chart-container">
                <Line data={datosOperacionChart} options={chartOptions} />
              </div>
            </div>

            <div className="dashboard-card chart-card">
              <h2>Beneficio neto por mes</h2>
              <div className="chart-container">
                <Line data={beneficioChart} options={chartOptions} />
              </div>
            </div>
          </section>

          <section className="dashboard-kpis">
            <div className="dashboard-card kpi-card">
              <span>Tasa de crecimiento promedio</span>
              <strong>{tasaCrecimientoPromedio.toFixed(2)}%</strong>
              <p>Calculada sobre el beneficio neto mes a mes.</p>
            </div>

            <div className="dashboard-card kpi-card">
              <span>Tendencia</span>
              <strong>{tendencia}</strong>
              <p>
                Basada en el crecimiento promedio del beneficio neto registrado.
              </p>
            </div>
          </section>

          <section className="dashboard-card table-card">
            <h2>Tabla de registros mensuales</h2>

            <div className="table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Mes</th>
                    <th>Ventas</th>
                    <th>Costos</th>
                    <th>Gastos</th>
                    <th>Beneficio neto</th>
                    <th>Crecimiento beneficio</th>
                  </tr>
                </thead>

                <tbody>
                  {registros.map((registro, index) => (
                    <tr key={registro.registro_id}>
                      <td>{formatMonth(registro.mes)}</td>
                      <td>{formatCurrency(registro.ventas)}</td>
                      <td>{formatCurrency(registro.costos)}</td>
                      <td>{formatCurrency(registro.gastos)}</td>
                      <td>{formatCurrency(registro.beneficio_neto)}</td>
                      <td>
                        {tasasCrecimiento[index] === null
                          ? "—"
                          : `${tasasCrecimiento[index]?.toFixed(2)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
};

export default Dashboard;