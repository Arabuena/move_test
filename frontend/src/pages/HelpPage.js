import React from 'react';
import { useParams } from 'react-router-dom';
import SupportChat from '../components/SupportChat';
import { useAuth } from '../contexts/AuthContext';

export default function HelpPage() {
  const { type } = useParams();
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {type === 'support' ? (
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">
              Central de Ajuda
            </h1>
            <SupportChat />
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">
              Selecione uma opção de ajuda no menu.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 