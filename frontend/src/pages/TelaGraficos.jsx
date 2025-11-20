import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import { api } from "../api/api";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend);

export default function TelaGraficos() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/graficos-data")
      .then((res) => setData(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-white bg-slate-900 min-h-screen flex items-center justify-center">Carregando indicadores...</div>;
  if (!data) return <div className="p-10 text-white bg-slate-900 min-h-screen">Sem dados disponíveis.</div>;

  const buildChartData = (apiData, type = "line") => {
    if (!apiData || !apiData.valores) return { labels: [], datasets: [] };
    
    // Tenta pegar qualquer chave de label que venha do backend (meses, regionais, categorias)
    const labels = apiData.meses || apiData.regionais || apiData.categorias || [];
    
    // Paleta neon
    const colors = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#06b6d4"];
    
    const datasets = Object.keys(apiData.valores).map((key, index) => ({
      label: key,
      data: apiData.valores[key],
      borderColor: colors[index % colors.length],
      backgroundColor: type === "line" ? colors[index % colors.length] : colors[index % colors.length] + "cc",
      borderWidth: type === "bar" ? 0 : 2,
      tension: 0.3,
    }));

    return { labels, datasets };
  };

  const commonOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { 
      legend: { labels: { color: "#e2e8f0", font: { size: 12 } } },
      tooltip: { backgroundColor: "#1e293b", titleColor: "#fff", bodyColor: "#cbd5e1" }
    },
    scales: { 
      x: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } }, 
      y: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" } } 
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate("/home")} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold">Indicadores de Performance</h1>
          <p className="text-slate-400 text-sm">Visualização analítica dos dados operacionais</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
        
        {/* 1. Evolução Anual */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg col-span-1 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-blue-400">Evolução Anual</h2>
          <div className="h-80">
            <Line data={buildChartData(data.restaurante_anual, "line")} options={commonOptions} />
          </div>
        </div>

        {/* 2. Por Regional (AGORA CORRIGIDO: X=Regionais, Series=Meses) */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg col-span-1 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-purple-400">Performance Mensal por Regional</h2>
          <div className="h-80">
            <Bar data={buildChartData(data.restaurante_regional, "bar")} options={commonOptions} />
          </div>
        </div>

        {/* 3. Backroom */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-emerald-400">Status Backroom</h2>
          <div className="h-64">
            <Bar data={buildChartData(data.backroom, "bar")} options={commonOptions} />
          </div>
        </div>

        {/* 4. Gelo */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-lg font-semibold mb-4 text-cyan-400">Análises de Gelo</h2>
          <div className="h-64">
            <Bar data={buildChartData(data.gelo, "bar")} options={commonOptions} />
          </div>
        </div>

        {/* 5. Pendências Gelo */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg col-span-1 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-red-400">Detalhamento: Pendências de Gelo</h2>
          <div className="h-72">
            <Bar data={buildChartData(data.pendencias_gelo, "bar")} options={commonOptions} />
          </div>
        </div>

      </div>
    </div>
  );
}