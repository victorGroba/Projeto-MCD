import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
import Home from "../pages/Home";
import PrivateRoute from "./PrivateRoute";

// Páginas dos Módulos
import TelaGeral from "../pages/TelaGeral";
import TelaGraficos from "../pages/TelaGraficos";
import TelaHACCP from "../pages/TelaHACCP";
import TelaGraficosHACCP from "../pages/TelaGraficosHACCP"; // <--- NOVO IMPORT
import TelaVisa from "../pages/TelaVisa";

// Página de Administração
import AdminUsers from "../pages/AdminUsers";

// Páginas Legado
import DashboardCliente from "../pages/DashboardCliente";
import DashboardOperacional from "../pages/DashboardOperacional";
import Ranking from "../pages/Ranking";
import Graficos from "../pages/Graficos";
import Heatmap from "../pages/Heatmap";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota padrão redireciona para Login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Rota Pública */}
        <Route path="/login" element={<Login />} />

        {/* Rota Principal */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <Home />
            </PrivateRoute>
          }
        />

        {/* --- ROTAS DOS MÓDULOS --- */}
        <Route
          path="/potabilidade"
          element={
            <PrivateRoute>
              <TelaGeral />
            </PrivateRoute>
          }
        />
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
        <Route
          path="/graficos-novo"
          element={
            <PrivateRoute>
              <TelaGraficos />
            </PrivateRoute>
          }
        />
        
        {/* --- NOVA ROTA DE GRÁFICOS HACCP --- */}
        <Route
          path="/graficos-haccp"
          element={
            <PrivateRoute>
              <TelaGraficosHACCP />
            </PrivateRoute>
          }
        />

        {/* --- ROTA DE ADMINISTRAÇÃO --- */}
        <Route
          path="/admin-users"
          element={
            <PrivateRoute>
              <AdminUsers />
            </PrivateRoute>
          }
        />

        {/* --- ROTAS LEGADO --- */}
        <Route path="/cliente" element={<PrivateRoute><DashboardCliente /></PrivateRoute>} />
        <Route path="/operacional" element={<PrivateRoute><DashboardOperacional /></PrivateRoute>} />
        <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
        <Route path="/graficos" element={<PrivateRoute><Graficos /></PrivateRoute>} />
        <Route path="/heatmap" element={<PrivateRoute><Heatmap /></PrivateRoute>} />

        {/* Rota de "catch-all" para páginas não encontradas */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}