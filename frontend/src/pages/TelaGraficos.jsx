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
  const { token, user } = useAuth();
  const [data, setData] = useState(null);

  const carregar = async () => {
    console.log("➡ TOKEN RECEBIDO NO COMPONENTE:", token);
    console.log("➡ USER RECEBIDO NO COMPONENTE:", user);

    if (!token) {
      console.log("⛔ SEM TOKEN — Não posso buscar os gráficos ainda");
      return;
    }

    try {
      console.log("➡ ENVIANDO FETCH PARA: http://localhost:8000/api/graficos-data");

      const resp = await fetch("http://localhost:8000/api/graficos-data", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("➡ STATUS DA RESPOSTA:", resp.status);

      if (!resp.ok) {
        console.error("⛔ ERRO AO BUSCAR GRÁFICOS:", resp.status);
        return;
      }

      const json = await resp.json();
      console.log("➡ JSON RECEBIDO:", json);
      setData(json);

    } catch (err) {
      console.error("⛔ ERRO FATAL NO FETCH:", err);
    }
  };

  useEffect(() => {
    if (token) carregar();
  }, [token]);

  if (!data) return <p className="p-4 text-lg">Carregando gráficos...</p>;

  const graficoAnual = {
    labels: data.pendencia_anual.map((l) => l.mes),
    datasets: [
      {
        label: "2023",
        data: data.pendencia_anual.map((l) => l["2023"]),
      },
      {
        label: "2024",
        data: data.pendencia_anual.map((l) => l["2024"]),
      },
      {
        label: "2025",
        data: data.pendencia_anual.map((l) => l["2025"]),
      },
    ],
  };

  const graficoRegional = {
    labels: data.pendencia_regional.map((l) => l.mes),
    datasets: Object.keys(data.pendencia_regional[0])
      .filter((k) => k !== "mes")
      .map((reg) => ({
        label: reg,
        data: data.pendencia_regional.map((l) => l[reg]),
      })),
  };

  const graficoBackroom = {
    labels: data.backroom.map((l) => l.regional),
    datasets: Object.keys(data.backroom[0])
      .filter((k) => k !== "regional")
      .map((cat) => ({
        label: cat,
        data: data.backroom.map((l) => l[cat]),
      })),
  };

  const graficoGelo = {
    labels: data.gelo.map((l) => l.regional),
    datasets: Object.keys(data.gelo[0])
      .filter((k) => k !== "regional")
      .map((cat) => ({
        label: cat,
        data: data.gelo.map((l) => l[cat]),
      })),
  };

  const graficoPendenciasGelo = {
    labels: data.pendencias_gelo.map((l) => l.regional),
    datasets: Object.keys(data.pendencias_gelo[0])
      .filter((k) => k !== "regional")
      .map((cat) => ({
        label: cat,
        data: data.pendencias_gelo.map((l) => l[cat]),
      })),
  };

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-3xl font-bold">Gráficos</h1>

      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl mb-4">Pendência Restaurante Anual</h2>
        <Line data={graficoAnual} />
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl mb-4">Pendência Restaurante por Regional</h2>
        <Bar data={graficoRegional} />
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl mb-4">Backroom</h2>
        <Bar data={graficoBackroom} />
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl mb-4">Gelo</h2>
        <Bar data={graficoGelo} />
      </div>

      <div className="bg-white shadow rounded-xl p-6">
        <h2 className="text-xl mb-4">Pendências de Gelo</h2>
        <Bar data={graficoPendenciasGelo} />
      </div>
    </div>
  );
}