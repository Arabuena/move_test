import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import RequestRide from './pages/RequestRide';
import DriverDashboard from './pages/DriverDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { useAuth } from './contexts/AuthContext';

// Componente para proteger rotas
const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  
  console.log('PrivateRoute - Verificando autenticação:', {
    user,
    allowedRoles,
    path: window.location.pathname
  });

  if (!user) {
    console.log('PrivateRoute - Usuário não autenticado');
    return <Navigate to="/login" />;
  }

  console.log('PrivateRoute - Verificando permissões:', {
    userRole: user.role,
    allowedRoles,
    path: window.location.pathname
  });

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('PrivateRoute - Acesso negado: role não permitida');
    return <Navigate to="/home" />;
  }

  console.log('PrivateRoute - Acesso permitido');
  return children;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      
      {/* Rota do Passageiro */}
      <Route 
        path="/request-ride" 
        element={
          <PrivateRoute allowedRoles={['user', 'passenger']}>
            <RequestRide />
          </PrivateRoute>
        } 
      />

      {/* Rota do Motorista */}
      <Route 
        path="/driver-dashboard" 
        element={
          <PrivateRoute allowedRoles={['driver']}>
            <DriverDashboard />
          </PrivateRoute>
        } 
      />

      {/* Rota do Admin */}
      <Route 
        path="/admin" 
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </PrivateRoute>
        } 
      />

      {/* Rota padrão para não encontrado */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
} 