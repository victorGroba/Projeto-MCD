import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "../pages/Login";
import DashboardCliente from "../pages/DashboardCliente";
import DashboardOperacional from "../pages/DashboardOperacional";
import Graficos from "../pages/Graficos";
import Ranking from "../pages/Ranking";
import Heatmap from "../pages/Heatmap";

import { auth } from "../store/auth";

function PrivateRoute({ children }) {
  return auth.isLogged() ? children : <Navigate to="/login" />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/cliente" element={<PrivateRoute><DashboardCliente /></PrivateRoute>} />
        <Route path="/operacional" element={<PrivateRoute><DashboardOperacional /></PrivateRoute>} />
        <Route path="/graficos" element={<PrivateRoute><Graficos /></PrivateRoute>} />
        <Route path="/ranking" element={<PrivateRoute><Ranking /></PrivateRoute>} />
        <Route path="/heatmap" element={<PrivateRoute><Heatmap /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}
