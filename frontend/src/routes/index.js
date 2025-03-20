import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DriverRegister from '../pages/DriverRegister';
import RequestRide from '../pages/RequestRide';
import DriverDashboard from '../pages/DriverDashboard';
import PrivateRoute from './PrivateRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/driver-register" element={<DriverRegister />} />
      <Route
        path="/request-ride"
        element={
          <PrivateRoute>
            <RequestRide />
          </PrivateRoute>
        }
      />
      <Route
        path="/driver-dashboard"
        element={
          <PrivateRoute>
            <DriverDashboard />
          </PrivateRoute>
        }
      />
      <Route path="/" element={<PrivateRoute><RequestRide /></PrivateRoute>} />
    </Routes>
  );
} 