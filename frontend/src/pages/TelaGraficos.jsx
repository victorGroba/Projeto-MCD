import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import { api } from "../api/api";
import { ArrowLeft, RefreshCw, BarChart2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";

// --- PLUGIN PARA VALORES ---
const drawValuesPlugin = {
  id: "drawValues",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      if (meta.hidden) return;
      meta.data.forEach((element, index) => {
        const value = dataset.data[index];
        if (value !== null && value !== undefined && value > 0) {
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(value, element.x, element.y - 3);
          ctx.restore();
        }
      });
    });
  },
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  drawValuesPlugin
);

const ORDEM_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

export default function TelaGraficos() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    api.get("/api/graficos-data")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
        <p className="text-slate-400 font-medium">Carregando dados...</p>
      </div>
    </div>
  );

  // --- BUILDER PARA OS 5 GRÁFICOS ORIGINAIS ---
  const buildLegacyChart = (apiData) => {
    if (!apiData || !apiData.valores) return { labels: [], datasets: [] };
    
    const labels = apiData.labels || apiData.regionais || apiData.meses || [];
    let keys = Object.keys(apiData.valores);
    
    // Ordenação Meses
    if (keys.some(k => ORDEM_MESES.includes(k.toLowerCase().trim()))) {
      keys.sort((a, b) => {
        const idxA = ORDEM_MESES.indexOf(a.toLowerCase().trim());
        const idxB = ORDEM_MESES.indexOf(b.toLowerCase().trim());
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      });
    }

    const excelColors = ["#3b82f6", "#f97316", "#94a3b8", "#eab308", "#22c55e"];
    
    const datasets = keys.map((key, index) => ({
      label: key, 
      data: apiData.valores[key],
      backgroundColor: excelColors[index % excelColors.length],
      borderColor: excelColors[index % excelColors.length],
      borderWidth: 1,
      borderRadius: 4,
    }));

    return { labels, datasets };
  };

  // --- RENDERIZADOR DOS NOVOS GRÁFICOS DETALHADOS (Lado a Lado) ---
  const renderTopicSection = (topicName) => {
    const listaGraficos = data?.detalhes_parametros?.[topicName];
    if (!listaGraficos || listaGraficos.length === 0) return null;

    return (
      <div className="col-span-1 lg:col-span-2 mt-10">
        <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-2">
          <BarChart2 className="text-blue-400" size={24} />
          <h2 className="text-2xl font-bold text-white capitalize">{topicName}</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listaGraficos.map((grafico, idx) => {
            const chartData = {
              labels: grafico.labels, 
              datasets: [
                {
                  label: "OK",
                  data: grafico.ok,
                  backgroundColor: "#22c55e",
                  hoverBackgroundColor: "#16a34a",
                  borderRadius: 4,
                },
                {
                  label: "NOK",
                  data: grafico.nok,
                  backgroundColor: "#ef4444",
                  hoverBackgroundColor: "#dc2626",
                  borderRadius: 4,
                }
              ]
            };

            return (
              <div key={idx} className="bg-slate-800 rounded-lg p-5 shadow-lg border border-slate-700 hover:border-slate-600 transition-colors">
                <h3 className="text-lg font-bold text-center mb-4 text-slate-200">{grafico.titulo}</h3>
                <div className="h-64 relative">
                  <Bar 
                    data={chartData} 
                    options={{
                      maintainAspectRatio: false,
                      responsive: true,
                      layout: { padding: { top: 20 } },
                      plugins: { 
                        legend: { position: 'bottom', labels: { color: '#cbd5e1', usePointStyle: true } },
                        tooltip: { backgroundColor: "#1e293b", borderColor: "#334155", borderWidth: 1 }
                      },
                      scales: {
                        x: { ticks: { color: "#94a3b8", font: { weight: "bold" } }, grid: { display: false }, stacked: false },
                        y: { ticks: { display: false }, grid: { color: "#334155", borderDash: [5, 5], drawBorder: false }, beginAtZero: true }
                      }
                    }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const commonOptions = {
    maintainAspectRatio: false,
    responsive: true,
    layout: { padding: { top: 20 } },
    plugins: { legend: { labels: { color: "#cbd5e1" } } },
    scales: {
      x: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } },
      y: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button onClick={() => navigate("/home")} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700 transition">
              <ArrowLeft size={20} className="text-slate-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Painel de Indicadores</h1>
              <p className="text-slate-400 text-sm">Monitoramento de Qualidade & Conformidade</p>
            </div>
          </div>
          <button onClick={fetchData} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg shadow-blue-900/20 transition flex items-center gap-2 font-semibold">
            <RefreshCw size={18} /> Atualizar
          </button>
        </div>

        {/* --- GRID DOS 5 GRÁFICOS ORIGINAIS (RESTORED) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-4">
          
          {/* 1. Pendência Anual */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl col-span-1 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-6 text-slate-200 border-l-4 border-blue-500 pl-3">
              Evolução Anual de Pendências (Geral)
            </h2>
            <div className="h-80">
              <Line data={buildLegacyChart(data?.restaurante_anual)} options={commonOptions} />
            </div>
          </div>

          {/* 2. Pendência Regional */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl col-span-1 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-6 text-slate-200 border-l-4 border-blue-500 pl-3">
              Pendências por Regional (Geral)
            </h2>
            <div className="h-96">
              <Bar data={buildLegacyChart(data?.restaurante_regional)} options={commonOptions} />
            </div>
          </div>

          {/* 3. Back Room (Geral) */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
            <h2 className="text-lg font-semibold mb-6 text-slate-200 border-l-4 border-blue-500 pl-3">
              Back Room (Visão Geral)
            </h2>
            <div className="h-72">
              <Bar data={buildLegacyChart(data?.backroom)} options={commonOptions} />
            </div>
          </div>

          {/* 4. Gelo (Geral) */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
            <h2 className="text-lg font-semibold mb-6 text-slate-200 border-l-4 border-blue-500 pl-3">
              Gelo (Visão Geral)
            </h2>
            <div className="h-72">
              <Bar data={buildLegacyChart(data?.gelo)} options={commonOptions} />
            </div>
          </div>

          {/* 5. Pendências de Gelo (Top 10) */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl col-span-1 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-6 text-slate-200 border-l-4 border-blue-500 pl-3">
              Pendências de Gelo (Top 10)
            </h2>
            <div className="h-72">
              <Bar data={buildLegacyChart(data?.pendencias_gelo)} options={commonOptions} />
            </div>
          </div>

        </div>

        {/* --- NOVAS SEÇÕES DE PARÂMETROS DETALHADOS --- */}
        {renderTopicSection("Back Room")}
        {renderTopicSection("Gelo Pool")}
        {renderTopicSection("Máquina de Gelo")}
        {renderTopicSection("Bin Café")}
        {renderTopicSection("Bin Bebidas")}

      </div>
    </div>
  );
}