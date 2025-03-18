import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MessageProvider } from './contexts/MessageContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import PassengerRegister from './pages/PassengerRegister';
import DriverRegister from './pages/DriverRegister';
import RequestRide from './pages/RequestRide';
import DriverDashboard from './pages/DriverDashboard';
import PrivateRoute from './components/PrivateRoute';
import AdminDashboard from './pages/AdminDashboard';
import RideDetails from './pages/RideDetails';
import HelpPage from './pages/HelpPage';
import MessagePoller from './components/MessagePoller';
import AdminSupportPage from './pages/AdminSupportPage';
import RideChat from './components/RideChat';

function App() {
  return (
    <AuthProvider>
      <MessageProvider>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          <MessagePoller />
          <div className="h-[calc(100vh-64px)]"> {/* 64px é a altura do Navbar */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register/passenger" element={<PassengerRegister />} />
              <Route path="/register/driver" element={<DriverRegister />} />
              <Route 
                path="/request-ride" 
                element={
                  <PrivateRoute roles={['passenger']}>
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
              <Route 
                path="/admin" 
                element={
                  <PrivateRoute roles={['admin']}>
                    <AdminDashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/rides/:rideId" 
                element={
                  <PrivateRoute roles={['passenger', 'driver']}>
                    <RideDetails />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/help/:type" 
                element={
                  <PrivateRoute>
                    <HelpPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/admin/support" 
                element={
                  <PrivateRoute roles={['admin']}>
                    <AdminSupportPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/help/chat" 
                element={
                  <PrivateRoute roles={['driver', 'user']}>
                    <RideChat />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </div>
        </div>
      </MessageProvider>
    </AuthProvider>
  );
}

export default App; 