import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "../pages/Login";
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

        {/* REDIRECIONAR "/" PARA LOGIN */}
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<Login />} />

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

        {/* SUAS PÁGINAS ANTIGAS */}
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

        {/* NOVAS PÁGINAS DO SISTEMA */}
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

      </Routes>
    </BrowserRouter>
  );
}