import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import { api } from "../api/api";
import { ArrowLeft, RefreshCw, BarChart2, Target, AlertTriangle, List, UserX, ChevronDown, ChevronUp, Filter } from "lucide-react";
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
import ChartDataLabels from "chartjs-plugin-datalabels";

// --- PLUGIN PARA VALORES E PORCENTAGEM (gráficos não-stacked) ---
const drawValuesPlugin = {
  id: "drawValues",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    // Não aplicar em gráficos stacked (conformidade mensal e regional)
    if (chart.options?._isStackedConformidade) return;

    const isStatusChart = chart.data.labels && chart.data.labels.length === 4 &&
      chart.data.labels[0] === "Programado" &&
      chart.data.labels[1] === "Insatisfatório" &&
      chart.data.labels[2] === "Satisfatório" &&
      chart.data.labels[3] === "Pendente";

    // Tenta encontrar os datasets de Satisfatório e Insatisfatório para calcular o total realizado
    const dsSat = chart.data.datasets.find(d => d.label === "Satisfatório");
    const dsInsat = chart.data.datasets.find(d => d.label === "Insatisfatório");

    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      if (meta.hidden) return;

      let totalRegion = 0;
      if (isStatusChart) {
        totalRegion = dataset.data.reduce((acc, val) => acc + (Number(val) || 0), 0);
      }

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

          // Lógica de % para gráficos de Status
          if (isStatusChart) {
            if (totalRegion > 0) {
              const pct = ((value / totalRegion) * 100).toFixed(1).replace('.', ',');

              ctx.fillText(value.toString(), element.x, element.y - 14);

              ctx.font = "bold 9px sans-serif";
              ctx.fillStyle = "#cbd5e1";
              ctx.fillText(`(${pct}%)`, element.x, element.y - 2);

              ctx.restore();
              return;
            }
          }
          // Lógica de % apenas para as barras de resultado (Sat/Insat) legadas
          else if ((dataset.label === "Satisfatório" || dataset.label === "Insatisfatório") && dsSat && dsInsat) {
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
  drawValuesPlugin,
  ChartDataLabels
);

const ORDEM_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

// --- Componente de seção retrátil ---
function CollapsibleSection({ title, icon, badge, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-10">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-slate-900 px-6 py-4 rounded-xl border border-slate-800 shadow-xl cursor-pointer hover:border-slate-600 transition-all select-none group"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
          {badge && (
            <span className="ml-2 text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
            {isOpen ? "Minimizar" : "Expandir"}
          </span>
          {isOpen ? (
            <ChevronUp className="text-slate-400 group-hover:text-white transition-colors" size={20} />
          ) : (
            <ChevronDown className="text-slate-400 group-hover:text-white transition-colors" size={20} />
          )}
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-[3000px] opacity-100 mt-0" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-slate-900 px-6 pb-6 pt-2 rounded-b-xl border border-t-0 border-slate-800 shadow-xl -mt-2">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function TelaGraficos() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(""); // Filtro mês para regional backroom
  const [selectedMonthGelo, setSelectedMonthGelo] = useState(""); // Filtro mês para regional gelo pool

  const fetchData = () => {
    setLoading(true);
    api.get("/api/graficos-data")
      .then((res) => {
        setData(res.data);
        // Define mês padrão como o primeiro mês disponível
        if (res.data?.backroom_regional?.meses?.length > 0 && !selectedMonth) {
          setSelectedMonth(res.data.backroom_regional.meses[0]);
        }
        if (res.data?.gelopool_regional?.meses?.length > 0 && !selectedMonthGelo) {
          setSelectedMonthGelo(res.data.gelopool_regional.meses[0]);
        }
      })
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

  // --- 2. Tipo de Coleta por Mês ---
  const buildTipoColetaChart = (apiData) => {
    if (!apiData) return { labels: [], datasets: [] };
    return {
      labels: apiData.labels,
      datasets: [
        { label: "Coleta", data: apiData.coleta, backgroundColor: "#3b82f6", borderRadius: 4 },
        { label: "Recoleta", data: apiData.recoleta, backgroundColor: "#f97316", borderRadius: 4 },
        { label: "Checklist", data: apiData.checklist, backgroundColor: "#94a3b8", borderRadius: 4 }
      ]
    };
  };

  // --- 3. Não Conformidade por Gerente ---
  const buildNaoConformidadeChart = (apiData) => {
    if (!apiData || !apiData.labels) return { labels: [], datasets: [] };
    return {
      labels: apiData.labels,
      datasets: [
        {
          label: "Pendências",
          data: apiData.valores,
          backgroundColor: "#ef4444",
          borderRadius: 4,
          barThickness: 22
        }
      ]
    };
  };

  // --- 2. Status por Regional (4 Barras) ---
  const buildStatusChart = (apiData) => {
    if (!apiData || !apiData.valores) return { labels: [], datasets: [] };

    const regionais = apiData.labels || []; // ["RSOU", "BRA", "SAO1", "SAO2"]
    const totais = apiData.valores["Total"] || [];
    const oks = apiData.valores["OK"] || [];
    const noks = apiData.valores["NOK"] || [];
    const pendentes = apiData.valores["Pendentes"] || Array(totais.length).fill(0);

    // Categorias no eixo X
    const categorias = ["Programado", "Insatisfatório", "Satisfatório", "Pendente"];

    // Cores distintas para cada regional
    const coresRegionais = ["#3b82f6", "#dc2626", "#65a30d", "#7c3aed", "#f59e0b", "#06b6d4"];

    // Cada regional vira um dataset com 4 valores (um para cada categoria)
    const datasets = regionais.map((regional, idx) => ({
      label: regional,
      data: [
        totais[idx] || 0,      // Programado
        noks[idx] || 0,        // Insatisfatório
        oks[idx] || 0,         // Satisfatório
        pendentes[idx] || 0    // Pendente
      ],
      backgroundColor: coresRegionais[idx % coresRegionais.length],
      borderRadius: 3,
      barPercentage: 0.85,
      categoryPercentage: 0.85
    }));

    return { labels: categorias, datasets };
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

    const excelColors = [
      "#4285F4", // azul (janeiro)
      "#C53929", // vermelho escuro (fevereiro)
      "#9CCC65", // verde claro (março)
      "#7E57C2", // roxo (abril)
      "#26A69A", // turquesa (maio)
      "#FF9800", // laranja (junho)
      "#5E35B1", // indigo
      "#EF5350", // vermelho claro
      "#8BC34A", // lime
      "#AB47BC", // roxo claro
      "#00ACC1", // cyan
      "#FFA726"  // laranja claro
    ];
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

  // --- 4. Gráficos Top Pendências ---
  const buildPendenciasTopChart = (apiData) => {
    if (!apiData || !apiData.valores) return { labels: [], datasets: [] };

    const labels = apiData.labels || [];
    const keys = Object.keys(apiData.valores);
    const excelColors = [
      "#3b82f6", "#f97316", "#94a3b8", "#eab308", "#22c55e",
      "#ef4444", "#a855f7", "#ec4899", "#84cc16", "#06b6d4"
    ];
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
      <CollapsibleSection
        title={topicName}
        icon={<BarChart2 className="text-blue-400" size={22} />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
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
      </CollapsibleSection>
    );
  };

  const commonOptions = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: { labels: { color: "#cbd5e1", usePointStyle: true }, position: 'bottom' },
      tooltip: { backgroundColor: "#1e293b" },
      datalabels: { display: false } // Desabilita globalmente, ativa apenas onde necessário
    },
    scales: {
      x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
      y: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" }, beginAtZero: true }
    }
  };

  const statusOptions = {
    ...commonOptions,
    layout: { padding: { top: 25 } },
    plugins: {
      ...commonOptions.plugins,
      legend: { position: 'top', labels: { color: "#cbd5e1" } },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            const dataset = context.dataset;
            const value = dataset.data[context.dataIndex];
            const total = dataset.data.reduce((acc, val) => acc + (Number(val) || 0), 0);
            if (total > 0 && value > 0) {
              const pct = ((value / total) * 100).toFixed(1).replace('.', ',');
              return `${dataset.label}: ${value} (${pct}%)`;
            }
            return `${dataset.label}: ${value}`;
          }
        }
      }
    }
  };

  // ====================================================================
  // GRÁFICO CONFORMIDADE MENSAL - STACKED (padrão da foto)
  // Verde (OK) embaixo, Vermelho (NOK) em cima, mesma coluna
  // ====================================================================
  const buildStackedMensalData = () => {
    if (!data?.backroom_mensal?.labels?.length) return null;
    const { labels, ok, nok, ok_pct, nok_pct } = data.backroom_mensal;
    return {
      labels,
      datasets: [
        {
          label: "OK (Conforme)",
          data: ok,
          backgroundColor: "#22c55e",
          borderColor: "#16a34a",
          borderWidth: 1,
          barPercentage: 0.65,
          categoryPercentage: 0.8,
        },
        {
          label: "NOK (Não Conforme)",
          data: nok,
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          borderWidth: 1,
          barPercentage: 0.65,
          categoryPercentage: 0.8,
        }
      ]
    };
  };

  const stackedMensalOptions = {
    maintainAspectRatio: false,
    responsive: true,
    _isStackedConformidade: true,
    layout: { padding: { top: 30 } },
    scales: {
      x: {
        stacked: true,
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { display: false }
      },
      y: {
        stacked: true,
        ticks: {
          color: "#94a3b8",
          beginAtZero: true,
          callback: (v) => Number.isInteger(v) ? v : null
        },
        grid: { color: "#334155" },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: "#cbd5e1",
          usePointStyle: true,
          font: { size: 12, weight: 'bold' },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        borderColor: "#334155",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            const idx = context.dataIndex;
            const value = context.raw;
            const okVal = data.backroom_mensal.ok[idx] || 0;
            const nokVal = data.backroom_mensal.nok[idx] || 0;
            const total = okVal + nokVal;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1).replace('.', ',') : '0';
            return `${context.dataset.label}: ${value} de ${total} (${pct}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: { weight: 'bold', size: 11 },
        anchor: 'center',
        align: 'center',
        formatter: (value, context) => {
          if (!value || value === 0) return '';
          const idx = context.dataIndex;
          const okVal = data.backroom_mensal.ok[idx] || 0;
          const nokVal = data.backroom_mensal.nok[idx] || 0;
          const total = okVal + nokVal;
          if (total === 0) return '';
          const pct = ((value / total) * 100).toFixed(1).replace('.', ',');
          return `${pct}%`;
        }
      }
    }
  };

  // ====================================================================
  // GRÁFICO CONFORMIDADE POR REGIONAL - STACKED com filtro de mês
  // ====================================================================
  const buildRegionalData = () => {
    if (!data?.backroom_regional?.regionais?.length || !selectedMonth) return null;
    const { regionais, dados } = data.backroom_regional;
    const mesData = dados[selectedMonth];
    if (!mesData) return null;

    const okValues = regionais.map(r => mesData[r]?.ok || 0);
    const nokValues = regionais.map(r => mesData[r]?.nok || 0);

    return {
      labels: regionais,
      datasets: [
        {
          label: "OK (Conforme)",
          data: okValues,
          backgroundColor: "#22c55e",
          borderColor: "#16a34a",
          borderWidth: 1,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
        {
          label: "NOK (Não Conforme)",
          data: nokValues,
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          borderWidth: 1,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        }
      ]
    };
  };

  const stackedRegionalOptions = {
    maintainAspectRatio: false,
    responsive: true,
    _isStackedConformidade: true,
    layout: { padding: { top: 30 } },
    scales: {
      x: {
        stacked: true,
        ticks: { color: "#cbd5e1", font: { size: 13, weight: 'bold' } },
        grid: { display: false }
      },
      y: {
        stacked: true,
        ticks: {
          color: "#94a3b8",
          beginAtZero: true,
          callback: (v) => Number.isInteger(v) ? v : null
        },
        grid: { color: "#334155" },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: "#cbd5e1",
          usePointStyle: true,
          font: { size: 12, weight: 'bold' },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        borderColor: "#334155",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            if (!selectedMonth || !data?.backroom_regional?.dados) return '';
            const regional = data.backroom_regional.regionais[context.dataIndex];
            const mesData = data.backroom_regional.dados[selectedMonth];
            if (!mesData || !mesData[regional]) return '';
            const info = mesData[regional];
            const total = info.ok + info.nok;
            const value = context.raw;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1).replace('.', ',') : '0';
            return `${context.dataset.label}: ${value} de ${total} (${pct}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: { weight: 'bold', size: 12 },
        anchor: 'center',
        align: 'center',
        formatter: (value, context) => {
          if (!value || value === 0) return '';
          if (!selectedMonth || !data?.backroom_regional?.dados) return '';
          const regional = data.backroom_regional.regionais[context.dataIndex];
          const mesData = data.backroom_regional.dados[selectedMonth];
          if (!mesData || !mesData[regional]) return '';
          const info = mesData[regional];
          const total = info.ok + info.nok;
          if (total === 0) return '';
          const pct = ((value / total) * 100).toFixed(1).replace('.', ',');
          return `${pct}%`;
        }
      }
    }
  };

  // ====================================================================
  // GRÁFICO GELO POOL CONFORMIDADE MENSAL - STACKED
  // ====================================================================
  const buildStackedGeloMensalData = () => {
    if (!data?.gelopool_mensal?.labels?.length) return null;
    const { labels, ok, nok } = data.gelopool_mensal;
    return {
      labels,
      datasets: [
        {
          label: "OK (Conforme)",
          data: ok,
          backgroundColor: "#22c55e",
          borderColor: "#16a34a",
          borderWidth: 1,
          barPercentage: 0.65,
          categoryPercentage: 0.8,
        },
        {
          label: "NOK (Não Conforme)",
          data: nok,
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          borderWidth: 1,
          barPercentage: 0.65,
          categoryPercentage: 0.8,
        }
      ]
    };
  };

  const stackedGeloMensalOptions = {
    maintainAspectRatio: false,
    responsive: true,
    _isStackedConformidade: true,
    layout: { padding: { top: 30 } },
    scales: {
      x: {
        stacked: true,
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { display: false }
      },
      y: {
        stacked: true,
        ticks: {
          color: "#94a3b8",
          beginAtZero: true,
          callback: (v) => Number.isInteger(v) ? v : null
        },
        grid: { color: "#334155" },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: "#cbd5e1",
          usePointStyle: true,
          font: { size: 12, weight: 'bold' },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        borderColor: "#334155",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            const idx = context.dataIndex;
            const value = context.raw;
            const okVal = data.gelopool_mensal.ok[idx] || 0;
            const nokVal = data.gelopool_mensal.nok[idx] || 0;
            const total = okVal + nokVal;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1).replace('.', ',') : '0';
            return `${context.dataset.label}: ${value} de ${total} (${pct}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: { weight: 'bold', size: 11 },
        anchor: 'center',
        align: 'center',
        formatter: (value, context) => {
          if (!value || value === 0) return '';
          const idx = context.dataIndex;
          const okVal = data.gelopool_mensal.ok[idx] || 0;
          const nokVal = data.gelopool_mensal.nok[idx] || 0;
          const total = okVal + nokVal;
          if (total === 0) return '';
          const pct = ((value / total) * 100).toFixed(1).replace('.', ',');
          return `${pct}%`;
        }
      }
    }
  };

  // ====================================================================
  // GRÁFICO GELO POOL CONFORMIDADE POR REGIONAL - STACKED com filtro mês
  // ====================================================================
  const buildGeloRegionalData = () => {
    if (!data?.gelopool_regional?.regionais?.length || !selectedMonthGelo) return null;
    const { regionais, dados } = data.gelopool_regional;
    const mesData = dados[selectedMonthGelo];
    if (!mesData) return null;

    const okValues = regionais.map(r => mesData[r]?.ok || 0);
    const nokValues = regionais.map(r => mesData[r]?.nok || 0);

    return {
      labels: regionais,
      datasets: [
        {
          label: "OK (Conforme)",
          data: okValues,
          backgroundColor: "#22c55e",
          borderColor: "#16a34a",
          borderWidth: 1,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
        {
          label: "NOK (Não Conforme)",
          data: nokValues,
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          borderWidth: 1,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        }
      ]
    };
  };

  const stackedGeloRegionalOptions = {
    maintainAspectRatio: false,
    responsive: true,
    _isStackedConformidade: true,
    layout: { padding: { top: 30 } },
    scales: {
      x: {
        stacked: true,
        ticks: { color: "#cbd5e1", font: { size: 13, weight: 'bold' } },
        grid: { display: false }
      },
      y: {
        stacked: true,
        ticks: {
          color: "#94a3b8",
          beginAtZero: true,
          callback: (v) => Number.isInteger(v) ? v : null
        },
        grid: { color: "#334155" },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: "#cbd5e1",
          usePointStyle: true,
          font: { size: 12, weight: 'bold' },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        borderColor: "#334155",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            if (!selectedMonthGelo || !data?.gelopool_regional?.dados) return '';
            const regional = data.gelopool_regional.regionais[context.dataIndex];
            const mesData = data.gelopool_regional.dados[selectedMonthGelo];
            if (!mesData || !mesData[regional]) return '';
            const info = mesData[regional];
            const total = info.ok + info.nok;
            const value = context.raw;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1).replace('.', ',') : '0';
            return `${context.dataset.label}: ${value} de ${total} (${pct}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: { weight: 'bold', size: 12 },
        anchor: 'center',
        align: 'center',
        formatter: (value, context) => {
          if (!value || value === 0) return '';
          if (!selectedMonthGelo || !data?.gelopool_regional?.dados) return '';
          const regional = data.gelopool_regional.regionais[context.dataIndex];
          const mesData = data.gelopool_regional.dados[selectedMonthGelo];
          if (!mesData || !mesData[regional]) return '';
          const info = mesData[regional];
          const total = info.ok + info.nok;
          if (total === 0) return '';
          const pct = ((value / total) * 100).toFixed(1).replace('.', ',');
          return `${pct}%`;
        }
      }
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
        <CollapsibleSection
          title="Cronograma Mensal: Programado vs Realizado (2026)"
          icon={<Target className="text-purple-500" size={22} />}
        >
          <div className="h-80 mt-4">
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
        </CollapsibleSection>

        {/* --- 2. GRÁFICO TIPO DE COLETA POR MÊS --- */}
        <CollapsibleSection
          title="Tipo de Coleta por Mês (2026)"
          icon={<List className="text-blue-400" size={22} />}
        >
          <div className="h-80 mt-4">
            <Bar
              data={buildTipoColetaChart(data?.tipo_coleta)}
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
        </CollapsibleSection>

        {/* --- 3. EVOLUÇÃO ANUAL DE PENDÊNCIAS --- */}
        <CollapsibleSection
          title="Evolução Anual de Pendências"
          icon={<BarChart2 className="text-blue-400" size={22} />}
        >
          <div className="h-80 mt-4">
            <Line data={buildLegacyChart(data?.restaurante_anual)} options={commonOptions} />
          </div>
        </CollapsibleSection>

        {/* --- 4. PENDÊNCIAS POR REGIONAL --- */}
        <CollapsibleSection
          title="Pendências por Regional"
          icon={<BarChart2 className="text-blue-400" size={22} />}
        >
          <div className="h-96 mt-4">
            <Bar data={buildLegacyChart(data?.restaurante_regional)} options={commonOptions} />
          </div>
        </CollapsibleSection>

        {/* --- CONFORMIDADE MENSAL (STACKED - Padrão da foto) --- */}
        {data?.backroom_mensal?.labels?.length > 0 && (
          <CollapsibleSection
            title="Back Room — Conformidade Mensal (2026)"
            icon={<BarChart2 className="text-emerald-400" size={22} />}
            badge='Valores "NA" excluídos do cálculo'
          >
            <div className="h-96 mt-4">
              <Bar
                data={buildStackedMensalData()}
                options={stackedMensalOptions}
              />
            </div>
            {/* Resumo em cards abaixo do gráfico */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {data.backroom_mensal.labels.map((mes, i) => {
                const ok = data.backroom_mensal.ok[i];
                const nok = data.backroom_mensal.nok[i];
                const total = ok + nok;
                const pctOk = total > 0 ? ((ok / total) * 100).toFixed(1) : '0';
                return (
                  <div key={mes} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 text-center">
                    <p className="text-sm font-semibold text-slate-300 mb-1">{mes}</p>
                    <div className="flex items-center justify-center gap-3 text-xs">
                      <span className="text-green-400 font-bold">{ok} OK</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-red-400 font-bold">{nok} NOK</span>
                    </div>
                    <div className="mt-1.5 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pctOk}%`,
                          background: `linear-gradient(90deg, #22c55e, #4ade80)`
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{pctOk}% conforme</p>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* --- CONFORMIDADE POR REGIONAL (STACKED + Filtro mês) --- */}
        {data?.backroom_regional?.regionais?.length > 0 && (
          <CollapsibleSection
            title="Back Room — Conformidade por Regional (2026)"
            icon={<BarChart2 className="text-amber-400" size={22} />}
            badge="Filtro por mês"
          >
            {/* Filtro de mês */}
            <div className="flex items-center gap-3 mt-4 mb-6">
              <Filter className="text-slate-400" size={18} />
              <span className="text-sm text-slate-400 font-medium">Mês:</span>
              <div className="flex flex-wrap gap-2">
                {data.backroom_regional.meses.map(mes => (
                  <button
                    key={mes}
                    onClick={() => setSelectedMonth(mes)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                      selectedMonth === mes
                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    }`}
                  >
                    {mes}
                  </button>
                ))}
              </div>
            </div>

            {/* Gráfico Regional */}
            {selectedMonth && buildRegionalData() && (
              <>
                <div className="h-96">
                  <Bar
                    data={buildRegionalData()}
                    options={stackedRegionalOptions}
                  />
                </div>
                {/* Cards por regional */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {data.backroom_regional.regionais.map((reg) => {
                    const mesData = data.backroom_regional.dados[selectedMonth];
                    if (!mesData || !mesData[reg]) return null;
                    const info = mesData[reg];
                    const total = info.ok + info.nok;
                    const pctOk = total > 0 ? info.ok_pct : 0;
                    return (
                      <div key={reg} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 text-center">
                        <p className="text-sm font-bold text-slate-200 mb-1">{reg}</p>
                        <div className="flex items-center justify-center gap-3 text-xs">
                          <span className="text-green-400 font-bold">{info.ok} OK</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-red-400 font-bold">{info.nok} NOK</span>
                        </div>
                        <div className="mt-1.5 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pctOk}%`,
                              background: `linear-gradient(90deg, #22c55e, #4ade80)`
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{pctOk}% conforme</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CollapsibleSection>
        )}

        {/* --- GELO POOL CONFORMIDADE MENSAL (STACKED) --- */}
        {data?.gelopool_mensal?.labels?.length > 0 && (
          <CollapsibleSection
            title="Gelo Pool — Conformidade Mensal (2026)"
            icon={<BarChart2 className="text-cyan-400" size={22} />}
            badge='Valores "NA" excluídos do cálculo'
          >
            <div className="h-96 mt-4">
              <Bar
                data={buildStackedGeloMensalData()}
                options={stackedGeloMensalOptions}
              />
            </div>
            {/* Resumo em cards abaixo do gráfico */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {data.gelopool_mensal.labels.map((mes, i) => {
                const ok = data.gelopool_mensal.ok[i];
                const nok = data.gelopool_mensal.nok[i];
                const total = ok + nok;
                const pctOk = total > 0 ? ((ok / total) * 100).toFixed(1) : '0';
                return (
                  <div key={mes} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 text-center">
                    <p className="text-sm font-semibold text-slate-300 mb-1">{mes}</p>
                    <div className="flex items-center justify-center gap-3 text-xs">
                      <span className="text-green-400 font-bold">{ok} OK</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-red-400 font-bold">{nok} NOK</span>
                    </div>
                    <div className="mt-1.5 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pctOk}%`,
                          background: `linear-gradient(90deg, #22c55e, #4ade80)`
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{pctOk}% conforme</p>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* --- GELO POOL CONFORMIDADE POR REGIONAL (STACKED + Filtro mês) --- */}
        {data?.gelopool_regional?.regionais?.length > 0 && (
          <CollapsibleSection
            title="Gelo Pool — Conformidade por Regional (2026)"
            icon={<BarChart2 className="text-teal-400" size={22} />}
            badge="Filtro por mês"
          >
            {/* Filtro de mês */}
            <div className="flex items-center gap-3 mt-4 mb-6">
              <Filter className="text-slate-400" size={18} />
              <span className="text-sm text-slate-400 font-medium">Mês:</span>
              <div className="flex flex-wrap gap-2">
                {data.gelopool_regional.meses.map(mes => (
                  <button
                    key={mes}
                    onClick={() => setSelectedMonthGelo(mes)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                      selectedMonthGelo === mes
                        ? "bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-500/20"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    }`}
                  >
                    {mes}
                  </button>
                ))}
              </div>
            </div>

            {/* Gráfico Regional Gelo Pool */}
            {selectedMonthGelo && buildGeloRegionalData() && (
              <>
                <div className="h-96">
                  <Bar
                    data={buildGeloRegionalData()}
                    options={stackedGeloRegionalOptions}
                  />
                </div>
                {/* Cards por regional */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {data.gelopool_regional.regionais.map((reg) => {
                    const mesData = data.gelopool_regional.dados[selectedMonthGelo];
                    if (!mesData || !mesData[reg]) return null;
                    const info = mesData[reg];
                    const total = info.ok + info.nok;
                    const pctOk = total > 0 ? info.ok_pct : 0;
                    return (
                      <div key={reg} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 text-center">
                        <p className="text-sm font-bold text-slate-200 mb-1">{reg}</p>
                        <div className="flex items-center justify-center gap-3 text-xs">
                          <span className="text-green-400 font-bold">{info.ok} OK</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-red-400 font-bold">{info.nok} NOK</span>
                        </div>
                        <div className="mt-1.5 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pctOk}%`,
                              background: `linear-gradient(90deg, #22c55e, #4ade80)`
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{pctOk}% conforme</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CollapsibleSection>
        )}

        {/* --- GRÁFICO NÃO CONFORMIDADE POR GERENTE --- */}
        {data?.nao_conformidade_gm?.labels?.length > 0 && (
          <CollapsibleSection
            title="Pendências Abertas por Gerente de Mercado"
            icon={<UserX className="text-red-400" size={22} />}
          >
            <div style={{ height: Math.max(300, (data?.nao_conformidade_gm?.labels?.length || 5) * 40) }} className="mt-4">
              <Bar
                data={buildNaoConformidadeChart(data?.nao_conformidade_gm)}
                options={{
                  ...commonOptions,
                  indexAxis: 'y',
                  scales: {
                    x: { ...commonOptions.scales.y, beginAtZero: true, ticks: { ...commonOptions.scales.y.ticks, stepSize: 1 } },
                    y: { ticks: { color: "#cbd5e1", font: { size: 11 } }, grid: { display: false } }
                  }
                }}
              />
            </div>
          </CollapsibleSection>
        )}

        {/* BACK ROOM (STATUS POR REGIONAL) */}
        <CollapsibleSection
          title="Back Room (Status por Regional)"
          icon={<BarChart2 className="text-blue-400" size={22} />}
        >
          <div className="h-96 mt-4">
            <Bar
              data={buildStatusChart(data?.backroom)}
              options={statusOptions}
            />
          </div>
        </CollapsibleSection>

        {/* GELO (STATUS POR REGIONAL) */}
        <CollapsibleSection
          title="Gelo (Status por Regional)"
          icon={<BarChart2 className="text-blue-400" size={22} />}
        >
          <div className="h-96 mt-4">
            <Bar
              data={buildStatusChart(data?.gelo)}
              options={statusOptions}
            />
          </div>
        </CollapsibleSection>

        {/* PENDÊNCIAS DE GELO (Máquina de Gelo, Bin da torre, Bin Mc Café) */}
        {data?.pendencias_gelo?.labels?.length > 0 && (
          <CollapsibleSection
            title="Pendências de Gelo por Regional"
            icon={<AlertTriangle className="text-yellow-400" size={22} />}
          >
            <div className="h-96 mt-4">
              <Bar
                data={buildPendenciasTopChart(data?.pendencias_gelo)}
                options={{
                  ...commonOptions,
                  scales: {
                    ...commonOptions.scales,
                    x: { ...commonOptions.scales.x, stacked: false },
                    y: { ...commonOptions.scales.y, stacked: false, ticks: { ...commonOptions.scales.y.ticks, stepSize: 1 } }
                  }
                }}
              />
            </div>
          </CollapsibleSection>
        )}



        {/* --- SEÇÕES DETALHADAS --- */}
        {renderTopicSection("Back Room")}
        {renderTopicSection("Gelo Pool")}
        {renderTopicSection("Máquina de Gelo")}
        {renderTopicSection("Bin Café")}
        {renderTopicSection("Bin Bebidas")}

      </div>
    </div>
  );
}