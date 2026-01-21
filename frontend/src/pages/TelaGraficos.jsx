import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import { api } from "../api/api";
import { ArrowLeft, RefreshCw, BarChart2, Target, AlertTriangle } from "lucide-react";
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

// --- PLUGIN PARA VALORES E PORCENTAGEM ---
// Calcula % baseada na soma de (Satisfatório + Insatisfatório)
const drawValuesPlugin = {
  id: "drawValues",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;
    
    // Tenta encontrar os datasets de Satisfatório e Insatisfatório para calcular o total realizado
    const dsSat = chart.data.datasets.find(d => d.label === "Satisfatório");
    const dsInsat = chart.data.datasets.find(d => d.label === "Insatisfatório");

    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      if (meta.hidden) return;
      
      meta.data.forEach((element, index) => {
        const value = dataset.data[index];
        
        // Só desenha se tiver valor > 0
        if (value !== null && value !== undefined && value > 0) {
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";
          
          let text = value.toString();
          
          // Lógica de % apenas para as barras de resultado (Sat/Insat)
          if ((dataset.label === "Satisfatório" || dataset.label === "Insatisfatório") && dsSat && dsInsat) {
            const valSat = dsSat.data[index] || 0;
            const valInsat = dsInsat.data[index] || 0;
            const totalRealizado = valSat + valInsat;

            if (totalRealizado > 0) {
              const pct = ((value / totalRealizado) * 100).toFixed(0); 
              text = `${value} (${pct}%)`;
            }
          }

          ctx.fillText(text, element.x, element.y - 3);
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
      .catch((err) => console.error("Erro ao carregar gráficos:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
        <p className="text-slate-400 font-medium">Carregando dados do servidor...</p>
      </div>
    </div>
  );

  // --- 1. Programado vs Realizado ---
  const buildComparisonChart = (apiData) => {
    if (!apiData) return { labels: [], datasets: [] };
    return {
      labels: apiData.labels,
      datasets: [
        { label: "Programado", data: apiData.programado, backgroundColor: "#8b5cf6", borderRadius: 4 },
        { label: "Realizado", data: apiData.realizado, backgroundColor: "#10b981", borderRadius: 4 }
      ]
    };
  };

  // --- 2. Status por Regional (4 Barras) ---
  const buildStatusChart = (apiData) => {
    if (!apiData || !apiData.valores) return { labels: [], datasets: [] };

    // Recupera os arrays brutos
    const totais = apiData.valores["Total"] || [];
    const oks = apiData.valores["OK"] || [];
    const noks = apiData.valores["NOK"] || [];
    
    // Calcula pendentes: Programado - (OK + NOK)
    const pendentes = totais.map((total, idx) => {
        const realizado = (oks[idx] || 0) + (noks[idx] || 0);
        return Math.max(0, total - realizado);
    });

    return {
      labels: apiData.labels, // Siglas das Regionais
      datasets: [
        {
          label: "Programado",
          data: totais,
          backgroundColor: "#3b82f6", // Azul
          borderRadius: 3,
          barPercentage: 0.8,
          categoryPercentage: 0.8
        },
        {
          label: "Pendente",
          data: pendentes,
          backgroundColor: "#94a3b8", // Cinza
          borderRadius: 3,
           barPercentage: 0.8,
          categoryPercentage: 0.8
        },
        {
          label: "Satisfatório",
          data: oks,
          backgroundColor: "#22c55e", // Verde
          borderRadius: 3,
           barPercentage: 0.8,
          categoryPercentage: 0.8
        },
        {
          label: "Insatisfatório",
          data: noks,
          backgroundColor: "#ef4444", // Vermelho
          borderRadius: 3,
           barPercentage: 0.8,
          categoryPercentage: 0.8
        }
      ]
    };
  };

  // --- 3. Gráficos Legados (Evolução, Top Pendências) ---
  const buildLegacyChart = (apiData) => {
    if (!apiData || !apiData.valores) return { labels: [], datasets: [] };
    const labels = apiData.labels || [];
    let keys = Object.keys(apiData.valores);
    
    // Ordena meses se necessário
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

  // Renderiza seções de detalhes (Máquina de Gelo, etc)
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
          {listaGraficos.map((grafico, idx) => (
            <div key={idx} className="bg-slate-800 rounded-lg p-5 shadow-lg border border-slate-700 hover:border-slate-600 transition-colors">
              <h3 className="text-lg font-bold text-center mb-4 text-slate-200">{grafico.titulo}</h3>
              <div className="h-64 relative">
                <Bar 
                  data={{
                    labels: grafico.labels, 
                    datasets: [
                      { label: "OK", data: grafico.ok, backgroundColor: "#22c55e", borderRadius: 4 },
                      { label: "NOK", data: grafico.nok, backgroundColor: "#ef4444", borderRadius: 4 }
                    ]
                  }} 
                  options={commonOptions} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const commonOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: { 
        legend: { labels: { color: "#cbd5e1", usePointStyle: true }, position: 'bottom' },
        tooltip: { backgroundColor: "#1e293b" }
    },
    scales: {
      x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
      y: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" }, beginAtZero: true }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/home")} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700 transition">
              <ArrowLeft size={20} className="text-slate-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Painel de Indicadores</h1>
              <p className="text-slate-400 text-sm">Monitoramento de Qualidade & Conformidade</p>
            </div>
          </div>
          <button onClick={fetchData} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg transition flex items-center gap-2 font-semibold">
            <RefreshCw size={18} /> Atualizar Dados
          </button>
        </div>

        {/* --- 1. GRÁFICO PROGRAMADO VS REALIZADO --- */}
        <div className="mb-10">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl">
            <div className="flex items-center gap-2 mb-6">
                <Target className="text-purple-500" size={22} />
                <h2 className="text-lg font-semibold text-slate-200">
                    Cronograma Mensal: Programado vs Realizado (2026)
                </h2>
            </div>
            <div className="h-80">
              <Bar 
                data={buildComparisonChart(data?.programado_realizado)} 
                options={{
                    ...commonOptions,
                    scales: {
                        ...commonOptions.scales,
                        x: { ...commonOptions.scales.x, stacked: false },
                        y: { ...commonOptions.scales.y, stacked: false }
                    }
                }} 
              />
            </div>
          </div>
        </div>

        {/* --- 2. GRID PRINCIPAL --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-4">
          
          {/* Evolução Anual */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl col-span-1 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-6 text-slate-200 border-l-4 border-blue-500 pl-3">Evolução Anual de Pendências</h2>
            <div className="h-80">
              <Line data={buildLegacyChart(data?.restaurante_anual)} options={commonOptions} />
            </div>
          </div>

          {/* Pendências Regionais */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl col-span-1 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-6 text-slate-200 border-l-4 border-blue-500 pl-3">Pendências por Regional</h2>
            <div className="h-96">
              <Bar data={buildLegacyChart(data?.restaurante_regional)} options={commonOptions} />
            </div>
          </div>

          {/* BACK ROOM (STATUS POR REGIONAL) */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl col-span-1 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-6 text-slate-200 border-l-4 border-blue-500 pl-3">Back Room (Status por Regional)</h2>
            <div className="h-96">
              <Bar 
                data={buildStatusChart(data?.backroom)} 
                options={{
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        legend: { position: 'top', labels: { color: "#cbd5e1" } }
                    }
                }} 
              />
            </div>
          </div>

          {/* GELO (STATUS POR REGIONAL) */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl col-span-1 lg:col-span-2">
            <h2 className="text-lg font-semibold mb-6 text-slate-200 border-l-4 border-blue-500 pl-3">Gelo (Status por Regional)</h2>
            <div className="h-96">
              <Bar 
                data={buildStatusChart(data?.gelo)} 
                options={{
                    ...commonOptions,
                    plugins: {
                        ...commonOptions.plugins,
                        legend: { position: 'top', labels: { color: "#cbd5e1" } }
                    }
                }} 
              />
            </div>
          </div>

          {/* TOP PENDÊNCIAS GELO */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl col-span-1 lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="text-red-500" size={22} />
                <h2 className="text-lg font-semibold text-slate-200">
                    Top Pendências de Gelo (Ocorrências)
                </h2>
            </div>
            <div className="h-96">
              <Bar 
                data={buildLegacyChart(data?.pendencias_gelo)} 
                options={{
                  ...commonOptions,
                  indexAxis: 'y', // Barras horizontais
                }} 
              />
            </div>
          </div>

        </div>

        {/* --- 3. SEÇÕES DETALHADAS --- */}
        {renderTopicSection("Back Room")}
        {renderTopicSection("Gelo Pool")}
        {renderTopicSection("Máquina de Gelo")}
        {renderTopicSection("Bin Café")}
        {renderTopicSection("Bin Bebidas")}

      </div>
    </div>
  );
}