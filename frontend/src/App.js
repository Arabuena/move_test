import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MessageProvider } from './contexts/MessageContext';
import AppRoutes from './routes';
import Navbar from './components/Navbar';
import { LoadScript } from '@react-google-maps/api';

function App() {
  return (
    <Router>
      <AuthProvider>
        <MessageProvider>
          <LoadScript
            googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}
            libraries={["places"]}
          >
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <AppRoutes />
            </div>
          </LoadScript>
        </MessageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App; 