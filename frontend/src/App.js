import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { MessageProvider } from './contexts/MessageContext';
import AppRoutes from './routes';
import Navbar from './components/Navbar';
import { LoadScript } from '@react-google-maps/api';

function App() {
  return (
    <AuthProvider>
      <MessageProvider>
        <LoadScript
          googleMapsApiKey="AIzaSyAVe7W-B0zZa-6ePrcLfZkDzs1RGRSHSCc"
          libraries={["places"]}
        >
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <AppRoutes />
          </div>
        </LoadScript>
      </MessageProvider>
    </AuthProvider>
  );
}

export default App; 