import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home"; // <--- Nova página Hub
import DashboardCliente from "../pages/DashboardCliente";
import DashboardOperacional from "../pages/DashboardOperacional";
import Ranking from "../pages/Ranking";
import Graficos from "../pages/Graficos";
import Heatmap from "../pages/Heatmap";
import PrivateRoute from "./PrivateRoute";
import TelaGeral from "../pages/TelaGeral";
import TelaGraficos from "../pages/TelaGraficos";

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

        {/* --- NOVAS PÁGINAS DO SISTEMA (Conectadas ao Hub) --- */}
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