import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import { api } from "../api/api";
import { ArrowLeft, RefreshCw, ShieldAlert } from "lucide-react";
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

// Plugin para desenhar valores
const drawValuesPlugin = {
  id: "drawValues",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      if (meta.hidden) return;
      meta.data.forEach((element, index) => {
        const value = dataset.data[index];
        if (value) {
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 11px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          ctx.fillText(value, element.x, element.y - 5);
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

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: "#1e293b" }
    },
    scales: {
      x: { ticks: { color: "#cbd5e1" }, grid: { color: "#334155" } },
      y: { ticks: { color: "#cbd5e1" }, grid: { color: "#334155" }, beginAtZero: true }
    },
    layout: { padding: { top: 20 } }
  };

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
              Gráficos HACCP
            </h1>
            <p className="text-slate-400 text-sm">Painel de Indicadores</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. Regional */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-orange-400">Pendências por Regional</h2>
            <div className="h-72">
              <Bar 
                data={createChartConfig("Regional", data?.regional?.labels, data?.regional?.values, "#f97316")} 
                options={options} 
              />
            </div>
          </div>

          {/* 2. Consultor */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg">
            <h2 className="text-lg font-bold mb-4 text-blue-400">Pendências por Consultor</h2>
            <div className="h-72">
              <Bar 
                data={createChartConfig("Consultor", data?.consultor?.labels, data?.consultor?.values, "#3b82f6")} 
                options={options} 
              />
            </div>
          </div>

          {/* 3. Não Conformidades (NOVO GRÁFICO) */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-lg col-span-1 lg:col-span-2">
            <h2 className="text-lg font-bold mb-4 text-red-400">Total de NOK por tópicos</h2>
            <div className="h-72">
              <Bar 
                data={createChartConfig("Quantidade", data?.nao_conformidades?.labels, data?.nao_conformidades?.values, "#ef4444")} 
                options={options} 
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
}