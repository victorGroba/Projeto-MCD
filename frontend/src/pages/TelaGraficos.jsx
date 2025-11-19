import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
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
import { useAuth } from "../store/AuthContext";

// Registo dos componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend
);

export default function TelaGraficos() {
  const { token } = useAuth(); 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cores = [
    "rgba(255, 99, 132, 0.7)",
    "rgba(54, 162, 235, 0.7)",
    "rgba(255, 206, 86, 0.7)",
    "rgba(75, 192, 192, 0.7)",
    "rgba(153, 102, 255, 0.7)",
  ];

  const carregar = async () => {
    if (!token) return;

    try {
      const resp = await fetch("http://localhost:8000/api/graficos-data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!resp.ok) {
        throw new Error(`Erro na API: ${resp.status}`);
      }

      const json = await resp.json();
      console.log("✅ Dados Recebidos:", json);
      setData(json);
    } catch (err) {
      console.error("⛔ Erro ao carregar:", err);
      setError("Falha ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) carregar();
  }, [token]);

  if (loading) return <div className="p-10 text-center">A carregar gráficos...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!data) return <div className="p-10 text-center">Sem dados disponíveis.</div>;

  // --- CONFIGURAÇÃO DOS GRÁFICOS ---
  // VOLTAMOS A USAR 'restaurante_anual' POIS É O QUE ESTÁ FUNCIONANDO NO /CLIENTE
  
  // 1. GRÁFICO ANUAL
  // Tenta ler 'restaurante_anual', se não achar, tenta 'pendencia_anual' por segurança
  const dadosAnuais = data.restaurante_anual || data.pendencia_anual || {};
  
  const graficoAnual = {
    labels: dadosAnuais.meses || [],
    datasets: Object.keys(dadosAnuais.valores || {}).map((ano, i) => ({
      label: ano,
      data: dadosAnuais.valores[ano],
      borderColor: cores[i % cores.length],
      backgroundColor: cores[i % cores.length],
      tension: 0.3,
    })),
  };

  // 2. GRÁFICO REGIONAL
  const dadosRegionais = data.restaurante_regional || data.pendencia_regional || {};
  
  const graficoRegional = {
    labels: dadosRegionais.meses || [],
    datasets: Object.keys(dadosRegionais.valores || {}).map((reg, i) => ({
      label: reg,
      data: dadosRegionais.valores[reg],
      backgroundColor: cores[i % cores.length],
    })),
  };

  // 3. BACKROOM
  const graficoBackroom = {
    labels: data.backroom?.categorias || [],
    datasets: Object.keys(data.backroom?.valores || {}).map((reg, i) => ({
      label: reg,
      data: data.backroom.valores[reg],
      backgroundColor: cores[i % cores.length],
    })),
  };

  // 4. GELO
  const graficoGelo = {
    labels: data.gelo?.categorias || [],
    datasets: Object.keys(data.gelo?.valores || {}).map((reg, i) => ({
      label: reg,
      data: data.gelo.valores[reg],
      backgroundColor: cores[i % cores.length],
    })),
  };

  // 5. PENDÊNCIAS GELO
  const graficoPendenciasGelo = {
    labels: data.pendencias_gelo?.categorias || [],
    datasets: Object.keys(data.pendencias_gelo?.valores || {}).map((reg, i) => ({
      label: reg,
      data: data.pendencias_gelo.valores[reg],
      backgroundColor: cores[i % cores.length],
    })),
  };

  return (
    <div className="p-6 space-y-10 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-800">Dashboard de Gráficos</h1>

      <div className="grid grid-cols-1 gap-8">
        {/* Gráfico de Linha Grande */}
        <div className="bg-white shadow-lg rounded-xl p-6">
          <h2 className="text-xl mb-4 font-semibold text-gray-700">Evolução Anual (Pendências)</h2>
          <div className="h-96">
            <Line 
              data={graficoAnual} 
              options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } }
              }} 
            />
          </div>
        </div>

        {/* Grids para os gráficos de barras */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl mb-4 font-semibold text-gray-700">Por Regional</h2>
            <Bar data={graficoRegional} />
          </div>

          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl mb-4 font-semibold text-gray-700">Backroom</h2>
            <Bar data={graficoBackroom} />
          </div>

          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl mb-4 font-semibold text-gray-700">Gelo</h2>
            <Bar data={graficoGelo} />
          </div>

          <div className="bg-white shadow-lg rounded-xl p-6">
            <h2 className="text-xl mb-4 font-semibold text-gray-700">Pendências Gelo</h2>
            <Bar data={graficoPendenciasGelo} />
          </div>
        </div>
      </div>
    </div>
  );
}