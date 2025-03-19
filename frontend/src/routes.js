import React from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RequestRide from './pages/RequestRide';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Componente para redirecionar usuários logados
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    // Redireciona baseado no tipo de usuário
    switch (user.role?.toLowerCase()) {
      case 'driver':
        return <Navigate to="/driver-dashboard" />;
      case 'admin':
        return <Navigate to="/admin" />;
      default:
        return <Navigate to="/request-ride" />;
    }
  }

  return children;
};

// Componente para proteger rotas que precisam de autenticação
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role?.toLowerCase())) {
    // Redireciona para o dashboard apropriado se tentar acessar uma rota não permitida
    switch (user.role?.toLowerCase()) {
      case 'driver':
        return <Navigate to="/driver-dashboard" />;
      case 'admin':
        return <Navigate to="/admin" />;
      default:
        return <Navigate to="/request-ride" />;
    }
  }

  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <HomePage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />

      {/* Rotas protegidas */}
      <Route
        path="/request-ride"
        element={
          <PrivateRoute allowedRoles={['user', 'passenger']}>
            <RequestRide />
          </PrivateRoute>
        }
      />
      <Route
        path="/driver-dashboard"
        element={
          <PrivateRoute allowedRoles={['driver']}>
            <DriverDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </PrivateRoute>
        }
      />

      {/* Redireciona qualquer outra rota para a página apropriada */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
} 