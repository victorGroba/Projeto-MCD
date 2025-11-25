import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import DashboardCliente from "../pages/DashboardCliente";
import DashboardOperacional from "../pages/DashboardOperacional";
import Ranking from "../pages/Ranking";
import Graficos from "../pages/Graficos";
import Heatmap from "../pages/Heatmap";
import PrivateRoute from "./PrivateRoute";
import TelaGeral from "../pages/TelaGeral";
import TelaGraficos from "../pages/TelaGraficos";
// --- NOVOS IMPORTS ---
import TelaHACCP from "../pages/TelaHACCP";
import TelaVisa from "../pages/TelaVisa";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rota padrão redireciona para Login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Rota Pública */}
        <Route path="/login" element={<Login />} />

        {/* --- ROTA PRINCIPAL (HUB) --- */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        {/* --- MÓDULOS PRINCIPAIS --- */}
        <Route
          path="/geral"
          element={
            <PrivateRoute>
              <TelaGeral />
            </PrivateRoute>
          }
        />

        <Route
          path="/graficos-novo"
          element={
            <PrivateRoute>
              <TelaGraficos />
            </PrivateRoute>
          }
        />

        {/* --- NOVOS MÓDULOS (HACCP e VISA) --- */}
        <Route
          path="/haccp"
          element={
            <PrivateRoute>
              <TelaHACCP />
            </PrivateRoute>
          }
        />

        <Route
          path="/visa"
          element={
            <PrivateRoute>
              <TelaVisa />
            </PrivateRoute>
          }
        />

        {/* --- ROTAS LEGADO / ESPECÍFICAS --- */}
        <Route
          path="/cliente"
          element={
            <PrivateRoute>
              <DashboardCliente />
            </PrivateRoute>
          }
        />

        <Route
          path="/operacional"
          element={
            <PrivateRoute>
              <DashboardOperacional />
            </PrivateRoute>
          }
        />

        <Route
          path="/ranking"
          element={
            <PrivateRoute>
              <Ranking />
            </PrivateRoute>
          }
        />

        <Route
          path="/graficos"
          element={
            <PrivateRoute>
              <Graficos />
            </PrivateRoute>
          }
        />

        <Route
          path="/heatmap"
          element={
            <PrivateRoute>
              <Heatmap />
            </PrivateRoute>
          }
        />

        {/* Rota de "catch-all" para páginas não encontradas */}
        <Route path="*" element={<Navigate to="/login" />} />

      </Routes>
    </BrowserRouter>
  );
}