import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import { api } from "../api/api";
import { ArrowLeft, RefreshCw } from "lucide-react";
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

// --- PLUGIN CUSTOMIZADO PARA EXIBIR VALORES ---
const drawValuesPlugin = {
  id: "drawValues",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      if (meta.hidden) return;

      meta.data.forEach((element, index) => {
        const value = dataset.data[index];
        
        // Só desenha se houver valor e for maior que 0 (opcional, pode remover a checagem de > 0 se quiser mostrar zeros)
        if (value !== null && value !== undefined && value !== 0) {
          ctx.save();
          ctx.fillStyle = "#ffffff"; // Cor do texto (Branco)
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";

          // Posição: X no centro da barra/ponto, Y um pouco acima
          ctx.fillText(value, element.x, element.y - 5);
          ctx.restore();
        }
      });
    });
  },
};

// Registra os componentes e o plugin novo
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  drawValuesPlugin // <--- Adicionado aqui
);

// Ordem cronológica correta para forçar a ordenação dos meses
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

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !data) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p>Carregando indicadores...</p>
      </div>
    </div>
  );

  const buildChartData = (apiData, type = "line") => {
    if (!apiData || !apiData.valores || Object.keys(apiData.valores).length === 0) {
      return { labels: [], datasets: [] };
    }
    
    // Eixos X
    const labels = apiData.status || apiData.regional || apiData.regionais || apiData.meses || [];
    
    // --- NOVA LÓGICA DE ORDENAÇÃO ---
    let keys = Object.keys(apiData.valores);
    const saoMeses = keys.some(k => ORDEM_MESES.includes(k.toLowerCase().trim()));

    if (saoMeses) {
      keys.sort((a, b) => {
        const idxA = ORDEM_MESES.indexOf(a.toLowerCase().trim());
        const idxB = ORDEM_MESES.indexOf(b.toLowerCase().trim());
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      });
    }

    // Paleta de Cores
    const excelColors = [
      "#4472C4", "#ED7D31", "#A5A5A5", "#FFC000", 
      "#5B9BD5", "#70AD47", "#264478", "#9E480E", 
    ];

    const datasets = keys.map((key, index) => ({
      label: key, 
      data: apiData.valores[key],
      backgroundColor: excelColors[index % excelColors.length],
      borderColor: excelColors[index % excelColors.length],
      borderWidth: 1,
      tension: 0.3,
    }));

    return { labels, datasets };
  };

  const commonOptions = {
    maintainAspectRatio: false,
    responsive: true,
    layout: {
      padding: {
        top: 25, // <--- Adicionado padding no topo para o número não cortar
      }
    },
    plugins: { 
      legend: { 
        position: 'top', 
        labels: { color: "#cbd5e1", font: { size: 12 }, boxWidth: 12 } 
      },
      tooltip: { 
        backgroundColor: "#1e293b", 
        titleColor: "#fff", 
        bodyColor: "#cbd5e1",
        borderColor: "#334155",
        borderWidth: 1
      }
    },
    scales: { 
      x: { 
        ticks: { color: "#94a3b8", font: { weight: 'bold' } }, 
        grid: { color: "#334155" } 
      }, 
      y: { 
        ticks: { color: "#94a3b8" }, 
        grid: { color: "#334155" },
        beginAtZero: true
      } 
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/home")} className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition border border-slate-700">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Painel de Indicadores</h1>
            <p className="text-slate-400 text-sm">Visão gráfica oficial</p>
          </div>
        </div>
        <button onClick={fetchData} className="p-2 bg-blue-600 rounded-lg hover:bg-blue-500 transition flex items-center gap-2 text-sm font-semibold">
          <RefreshCw size={16} /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
        
        {/* 1. PENDÊNCIA ANUAL */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg col-span-1 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4 text-center text-white">Pendência restaurante Anual</h2>
          <div className="h-80">
            <Line data={buildChartData(data?.restaurante_anual, "line")} options={commonOptions} />
          </div>
        </div>

        {/* 2. REGIONAL */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg col-span-1 lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 text-center text-white">Pendência restaurante por regional</h2>
          <div className="h-96">
            <Bar data={buildChartData(data?.restaurante_regional, "bar")} options={commonOptions} />
          </div>
        </div>

        {/* 3. BACKROOM */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-lg font-bold mb-4 text-center text-white">Back room</h2>
          <div className="h-72">
            <Bar data={buildChartData(data?.backroom, "bar")} options={commonOptions} />
          </div>
        </div>

        {/* 4. GELO */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-lg font-bold mb-4 text-center text-white">Gelo</h2>
          <div className="h-72">
            <Bar data={buildChartData(data?.gelo, "bar")} options={commonOptions} />
          </div>
        </div>

        {/* 5. PENDÊNCIAS DE GELO */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg col-span-1 lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 text-center text-white">Pendências de Gelo</h2>
          <div className="h-72">
            <Bar data={buildChartData(data?.pendencias_gelo, "bar")} options={commonOptions} />
          </div>
        </div>

      </div>
    </div>
  );
}