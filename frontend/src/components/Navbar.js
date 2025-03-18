import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const { unreadMessages } = useMessages();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Verifica se está em uma corrida ativa
  const isInRide = location.pathname.includes('/rides/') || 
                   location.pathname === '/request-ride' || 
                   location.pathname === '/driver-dashboard';

  const HelpMenu = () => (
    <div className="relative">
      <button 
        onClick={() => setIsHelpMenuOpen(!isHelpMenuOpen)}
        className="flex items-center text-white hover:bg-blue-600 px-3 py-2 rounded-md text-sm font-medium"
        onMouseEnter={() => setIsHelpMenuOpen(true)}
        onMouseLeave={() => setIsHelpMenuOpen(false)}
      >
        <span className="mr-2">Ajuda</span>
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        {unreadMessages && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
        )}
      </button>

      {isHelpMenuOpen && (
        <div 
          className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5"
          onMouseEnter={() => setIsHelpMenuOpen(true)}
          onMouseLeave={() => setIsHelpMenuOpen(false)}
        >
          <div className="py-1">
            {user?.role === 'admin' ? (
              // Menu para administradores
              <Link
                to="/admin/support"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Central de Suporte
              </Link>
            ) : (
              // Menu para usuários normais
              <Link
                to="/help/support"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Falar com Suporte
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <nav className="bg-gradient-to-r from-indigo-600 to-blue-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo e Nome */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-8 w-8"
              />
              <span className="text-white font-bold text-xl">Leva</span>
            </Link>
          </div>

          {/* Menu Principal - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Links baseados no papel do usuário */}
                {user.role === 'admin' ? (
                  <Link 
                    to="/admin" 
                    className="text-white hover:bg-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Painel Admin
                  </Link>
                ) : user.role === 'driver' ? (
                  <Link 
                    to="/driver-dashboard" 
                    className="text-white hover:bg-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link 
                    to="/request-ride" 
                    className="text-white hover:bg-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Solicitar Corrida
                  </Link>
                )}

                {/* Novo Menu de Ajuda */}
                <HelpMenu />

                {/* Menu do Usuário */}
                <div className="relative ml-3">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="flex items-center text-white hover:bg-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <span className="mr-2">{user.name}</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Perfil
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Sair
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-white hover:bg-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Entrar
                </Link>
                <Link 
                  to="/register/passenger" 
                  className="bg-white text-blue-600 hover:bg-gray-100 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Cadastrar
                </Link>
              </div>
            )}
          </div>

          {/* Menu Mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white hover:bg-blue-600 p-2 rounded-md"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Menu Mobile Expandido */}
      {isMenuOpen && (
        <div className="md:hidden bg-blue-500">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                {user.role === 'admin' ? (
                  <Link 
                    to="/admin" 
                    className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md text-base font-medium"
                  >
                    Painel Admin
                  </Link>
                ) : user.role === 'driver' ? (
                  <Link 
                    to="/driver-dashboard" 
                    className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md text-base font-medium"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <Link 
                    to="/request-ride" 
                    className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md text-base font-medium"
                  >
                    Solicitar Corrida
                  </Link>
                )}
                <Link
                  to="/help/chat"
                  className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Chat da Corrida
                </Link>
                <Link
                  to="/help/support"
                  className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Suporte
                </Link>
                <Link
                  to="/profile"
                  className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Perfil
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left text-white hover:bg-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Entrar
                </Link>
                <Link 
                  to="/register/passenger" 
                  className="block text-white hover:bg-blue-600 px-3 py-2 rounded-md text-base font-medium"
                >
                  Cadastrar
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
} 