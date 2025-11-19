import { useEffect, useState } from "react";
import { api } from "../api/api";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function DashboardCliente() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        console.log("Buscando dados de gráficos...");
        const response = await api.get("/api/graficos-data");
        setData(response.data);
      } catch (err) {
        console.error("Erro:", err);
        setError("Não foi possível carregar os dados da planilha.");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Função que transforma os dados do Excel para o formato do Gráfico
  const formatChartData = (graficoData) => {
    if (!graficoData || !graficoData.meses) return [];
    
    return graficoData.meses.map((mes, index) => {
      const item = { name: mes };
      // Para cada ano disponível (ex: 2023, 2024), adiciona o valor correspondente
      if (graficoData.valores) {
        Object.keys(graficoData.valores).forEach(ano => {
          item[ano] = graficoData.valores[ano][index];
        });
      }
      return item;
    });
  };

  // -- RENDERIZAÇÃO --
  
  // 1. Tela de Carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="animate-pulse">Carregando Dashboard...</div>
      </div>
    );
  }

  // 2. Tela de Erro
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-red-400">
        {error}
      </div>
    );
  }

  // 3. Tela Principal (Dashboard)
  const dadosAnuais = formatChartData(data?.restaurante_anual);
  const anos = data?.restaurante_anual?.valores ? Object.keys(data.restaurante_anual.valores) : [];
  const cores = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard de Qualidade</h1>
          <span className="text-sm text-gray-400">Dados atualizados do Excel</span>
        </div>

        {/* GRÁFICO 1: ANÁLISE ANUAL */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
          <h2 className="text-xl mb-6 font-semibold text-blue-400">
            Evolução Anual - Restaurantes
          </h2>
          
          <div className="h-[400px] w-full">
            {dadosAnuais.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosAnuais}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                  <XAxis dataKey="name" stroke="#ccc" />
                  <YAxis stroke="#ccc" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#fff' }}
                    cursor={{ fill: '#374151' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }}/>
                  {anos.map((ano, i) => (
                    <Bar 
                        key={ano} 
                        dataKey={ano} 
                        fill={cores[i % cores.length]} 
                        radius={[4, 4, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Nenhum dado encontrado para este gráfico.
              </div>
            )}
          </div>
        </div>
        
        {/* DEBUG: Mostra o JSON bruto no final da página se precisar checar os dados */}
        <details className="mt-8 bg-black/30 p-4 rounded text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-300">Ver Dados Brutos</summary>
          <pre className="mt-2 overflow-auto max-h-60">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}