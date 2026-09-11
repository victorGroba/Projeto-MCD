import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { api } from "../api/api";
import { ArrowLeft, RefreshCw, ShieldAlert, Bug, AlertTriangle, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

// Plugin para desenhar valores nas barras
const drawValuesPlugin = {
  id: "drawValues",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      if (meta.hidden) return;
      meta.data.forEach((element, index) => {
        const value = dataset.data[index];
        if (value && value > 0) {
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px sans-serif";

          // Barras horizontais (indexAxis === 'y')
          if (chart.options.indexAxis === "y") {
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(value, element.x + 6, element.y);
          } else {
            // Barras verticais
            ctx.textAlign = "center";
            ctx.textBaseline = "bottom";
            ctx.fillText(value, element.x, element.y - 5);
          }
          ctx.restore();
        }
      });
    });
  },
};

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, drawValuesPlugin);

export default function TelaGraficosHACCP() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.get("/api/haccp-graficos")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Opções para gráficos verticais ---
  const verticalOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#1e293b" },
      datalabels: { display: false }
    },
    scales: {
      x: { ticks: { color: "#cbd5e1", font: { size: 12, weight: "bold" } }, grid: { display: false } },
      y: { ticks: { color: "#cbd5e1" }, grid: { color: "#334155" }, beginAtZero: true }
    },
    layout: { padding: { top: 25 } }
  };

  // --- Opções para gráficos horizontais ---
  const horizontalOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    plugins: {
      legend: { 
        display: true, 
        position: "bottom",
        labels: { color: "#cbd5e1", usePointStyle: true, padding: 20, font: { size: 12 } }
      },
      tooltip: { backgroundColor: "#1e293b" },
      datalabels: { display: false }
    },
    scales: {
      x: { ticks: { color: "#cbd5e1" }, grid: { color: "#334155" }, beginAtZero: true },
      y: { ticks: { color: "#cbd5e1", font: { size: 12, weight: "bold" } }, grid: { display: false } }
    },
    layout: { padding: { right: 40 } }
  };

  // --- Opções para gráfico horizontal simples (sem legenda) ---
  const horizontalSimpleOptions = {
    ...horizontalOptions,
    plugins: {
      ...horizontalOptions.plugins,
      legend: { display: false }
    }
  };

  // --- Config do gráfico de Microrganismos ---
  const buildMicroorganismosChart = () => {
    if (!data?.microorganismos?.labels?.length) return null;
    const { labels, mesofilos, enterobacterias } = data.microorganismos;
    return {
      labels,
      datasets: [
        {
          label: "Mesófilos",
          data: mesofilos,
          backgroundColor: "#DAA520",
          borderColor: "#B8860B",
          borderWidth: 1,
          borderRadius: 3,
          barPercentage: 0.7,
          categoryPercentage: 0.85
        },
        {
          label: "Enterobactérias",
          data: enterobacterias,
          backgroundColor: "#C53929",
          borderColor: "#A52A1A",
          borderWidth: 1,
          borderRadius: 3,
          barPercentage: 0.7,
          categoryPercentage: 0.85
        }
      ]
    };
  };

  // --- Config do gráfico de Pendências por Tipo ---
  const buildPendenciasTipoChart = () => {
    if (!data?.pendencias_tipo?.labels?.length) return null;
    const { labels, valores } = data.pendencias_tipo;
    return {
      labels,
      datasets: [
        {
          label: "Pendências",
          data: valores,
          backgroundColor: "#DAA520",
          borderColor: "#B8860B",
          borderWidth: 1,
          borderRadius: 3,
          barPercentage: 0.6,
          categoryPercentage: 0.7
        }
      ]
    };
  };

  // --- Config do gráfico de Restaurantes por Regional ---
  const buildRegionalChart = () => {
    if (!data?.restaurantes_regional?.labels?.length) return null;
    const { labels, valores } = data.restaurantes_regional;
    return {
      labels,
      datasets: [
        {
          label: "Restaurantes",
          data: valores,
          backgroundColor: "#DAA520",
          borderColor: "#B8860B",
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.5,
          categoryPercentage: 0.6
        }
      ]
    };
  };

  // --- Config do gráfico de Restaurantes por Estado (UF) ---
  // Mesmo padrão e métrica do gráfico por Regional: o mapeamento Estado→Regional
  // não é 1:1 (SP se divide em SAO1 e SAO2), então as duas visões se complementam.
  const buildEstadoChart = () => {
    if (!data?.restaurantes_estado?.labels?.length) return null;
    const { labels, valores } = data.restaurantes_estado;
    return {
      labels,
      datasets: [
        {
          label: "Restaurantes",
          data: valores,
          backgroundColor: "#38bdf8",
          borderColor: "#0ea5e9",
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.5,
          categoryPercentage: 0.6
        }
      ]
    };
  };

  // --- Helper para criar config simples (gráficos existentes) ---
  const createChartConfig = (label, labels, values, color) => ({
    labels: labels || [],
    datasets: [
      {
        label: label,
        data: values || [],
        backgroundColor: color,
        borderColor: color,
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  });

  const microData = data ? buildMicroorganismosChart() : null;
  const pendTipoData = data ? buildPendenciasTipoChart() : null;
  const regionalData = data ? buildRegionalChart() : null;
  const estadoData = data ? buildEstadoChart() : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/haccp")} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition border border-slate-700">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldAlert className="text-orange-500" />
              Gráficos HACCP / APPCC
            </h1>
            <p className="text-slate-400 text-sm">Painel de Indicadores de Segurança Alimentar</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 bg-orange-600 rounded-lg hover:bg-orange-500 transition flex items-center gap-2 text-sm font-semibold">
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <div className="space-y-8">

          {/* ============================================= */}
          {/* NOVOS GRÁFICOS APPCC                         */}
          {/* ============================================= */}

          {/* 1. Presença de Microrganismos */}
          {microData && (
            <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
              <div className="flex items-center gap-3 mb-1">
                <Bug size={22} className="text-red-400" />
                <h2 className="text-lg font-bold text-red-400">Presença de Microrganismos no Restaurante</h2>
              </div>
              <p className="text-slate-500 text-sm mb-4 ml-9">
                ({data.microorganismos.total_restaurantes} Restaurantes avaliados)
              </p>
              <div style={{ height: `${Math.max(300, microData.labels.length * 55)}px` }}>
                <Bar data={microData} options={horizontalOptions} />
              </div>
            </div>
          )}

          {/* 2. Principais Pendências + 3. Regional — lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 2. Principais Pendências por Tipo */}
            {pendTipoData && (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
                <div className="flex items-center gap-3 mb-1">
                  <AlertTriangle size={22} className="text-amber-400" />
                  <h2 className="text-lg font-bold text-amber-400">Principais Pendências encontradas</h2>
                </div>
                <p className="text-slate-500 text-sm mb-4 ml-9">
                  ({data.pendencias_tipo.total_restaurantes} Restaurantes avaliados)
                </p>
                <div style={{ height: `${Math.max(250, pendTipoData.labels.length * 55)}px` }}>
                  <Bar data={pendTipoData} options={horizontalSimpleOptions} />
                </div>
              </div>
            )}

            {/* 3. Quantidade por Regional */}
            {regionalData && (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
                <div className="flex items-center gap-3 mb-1">
                  <MapPin size={22} className="text-amber-400" />
                  <h2 className="text-lg font-bold text-amber-400">Restaurantes coletados por Regional</h2>
                </div>
                <p className="text-slate-500 text-sm mb-4 ml-9">
                  ({data.restaurantes_regional.total_restaurantes} Restaurantes com coleta)
                </p>
                <div className="h-72">
                  <Bar data={regionalData} options={verticalOptions} />
                </div>
              </div>
            )}

            {/* 4. Quantidade por Estado (UF) */}
            {estadoData && (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
                <div className="flex items-center gap-3 mb-1">
                  <MapPin size={22} className="text-sky-400" />
                  <h2 className="text-lg font-bold text-sky-400">Restaurantes coletados por Estado</h2>
                </div>
                <p className="text-slate-500 text-sm mb-4 ml-9">
                  ({data.restaurantes_estado.total_restaurantes} Restaurantes com coleta)
                </p>
                <div className="h-72">
                  <Bar data={estadoData} options={verticalOptions} />
                </div>
              </div>
            )}
          </div>

          {/* ============================================= */}
          {/* GRÁFICOS EXISTENTES (Tabelas Dinâmicas)      */}
          {/* ============================================= */}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pendências por Regional (existente) */}
            {data?.regional?.labels?.length > 0 && (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
                <h2 className="text-lg font-bold mb-4 text-orange-400">Pendências por Regional</h2>
                <div className="h-72">
                  <Bar 
                    data={createChartConfig("Regional", data.regional.labels, data.regional.values, "#f97316")} 
                    options={verticalOptions} 
                  />
                </div>
              </div>
            )}

            {/* Pendências por Estado (UF) — mesma métrica, agrupada por UF */}
            {data?.pendencias_estado?.labels?.length > 0 && (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
                <h2 className="text-lg font-bold mb-1 text-orange-400">Pendências por Estado</h2>
                <p className="text-slate-500 text-sm mb-4">
                  ({data.pendencias_estado.total_restaurantes} restaurantes com pendência
                  {data.pendencias_estado.total_avaliados
                    ? ` de ${data.pendencias_estado.total_avaliados} avaliados`
                    : ''})
                </p>
                <div className="h-72">
                  <Bar
                    data={createChartConfig("Estado", data.pendencias_estado.labels, data.pendencias_estado.valores, "#fb923c")}
                    options={verticalOptions}
                  />
                </div>
              </div>
            )}

            {/* Pendências por Consultor (existente) */}
            {data?.consultor?.labels?.length > 0 && (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
                <h2 className="text-lg font-bold mb-4 text-blue-400">Pendências por Consultor</h2>
                <div className="h-72">
                  <Bar 
                    data={createChartConfig("Consultor", data.consultor.labels, data.consultor.values, "#3b82f6")} 
                    options={verticalOptions} 
                  />
                </div>
              </div>
            )}

            {/* Total de NOK por tópicos (existente) */}
            {data?.nao_conformidades?.labels?.length > 0 && (
              <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg col-span-1 lg:col-span-2">
                <h2 className="text-lg font-bold mb-4 text-red-400">Total de NOK por tópicos</h2>
                <div className="h-72">
                  <Bar 
                    data={createChartConfig("Quantidade", data.nao_conformidades.labels, data.nao_conformidades.values, "#ef4444")} 
                    options={verticalOptions} 
                  />
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}