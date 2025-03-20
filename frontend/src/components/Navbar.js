import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import logoFull from '../assets/images/logo-full.png';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const { unreadMessages } = useMessages();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-purple-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <img 
                src={logoFull} 
                alt="Move" 
                className="h-8 w-auto"
              />
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-purple-200">
                  Olá, {user.name || user.email}
                </span>
                
                {user.role === 'driver' && (
                  <Link
                    to="/driver-dashboard"
                    className="text-purple-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Dashboard
                  </Link>
                )}
                
                {user.role === 'user' && (
                  <Link
                    to="/request-ride"
                    className="text-purple-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Solicitar Corrida
                  </Link>
                )}
                
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-purple-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                  >
                    Admin
                  </Link>
                )}

                {/* Menu de Ajuda */}
                <div className="relative">
                  <button 
                    onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
                    className="text-purple-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
                    onMouseEnter={() => setIsHelpMenuOpen(true)}
                    onMouseLeave={() => setIsHelpMenuOpen(false)}
                  >
                    <span>Ajuda</span>
                    {unreadMessages && (
                      <span className="ml-1 h-2 w-2 bg-red-500 rounded-full"></span>
                    )}
                  </button>

                  {isHelpMenuOpen && (
                    <div 
                      className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
                      onMouseEnter={() => setIsHelpMenuOpen(true)}
                      onMouseLeave={() => setIsHelpMenuOpen(false)}
                    >
                      <div className="py-1">
                        <Link
                          to={user.role === 'admin' ? "/admin/support" : "/help/support"}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-purple-50"
                        >
                          {user.role === 'admin' ? 'Central de Suporte' : 'Falar com Suporte'}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={handleLogout}
                  className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-purple-200 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Entrar
                </Link>
                <Link
                  to="/register"
                  className="bg-purple-700 hover:bg-purple-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 