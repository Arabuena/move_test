import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function RideChat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentRide, setCurrentRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Scroll para a última mensagem
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Buscar corrida atual
  useEffect(() => {
    const fetchCurrentRide = async () => {
      try {
        const response = await api.get('/rides/current');
        if (response.data) {
          setCurrentRide(response.data);
          fetchMessages(response.data._id);
        } else {
          setError('Nenhuma corrida em andamento');
          setLoading(false);
        }
      } catch (err) {
        console.error('Erro ao buscar corrida:', err);
        setError('Erro ao carregar corrida');
        setLoading(false);
      }
    };

    fetchCurrentRide();
    const interval = setInterval(fetchCurrentRide, 5000);
    return () => clearInterval(interval);
  }, []);

  // Buscar mensagens
  const fetchMessages = async (rideId) => {
    try {
      const response = await api.get(`/messages/ride/${rideId}`);
      setMessages(response.data);
      setLoading(false);
      scrollToBottom();
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
      setError('Erro ao carregar mensagens');
      setLoading(false);
    }
  };

  // Enviar mensagem
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentRide) return;

    try {
      const response = await api.post(`/messages/ride/${currentRide._id}`, {
        content: newMessage
      });

      setMessages([...messages, response.data]);
      setNewMessage('');
      scrollToBottom();
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem');
    }
  };

  if (loading) return <div className="flex justify-center items-center h-full">Carregando...</div>;
  if (error) return <div className="text-red-500 text-center p-4">{error}</div>;
  if (!currentRide) return <div className="text-center p-4">Nenhuma corrida em andamento</div>;

  const otherUser = user.role === 'driver' ? currentRide.passenger : currentRide.driver;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Cabeçalho do chat */}
      <div className="bg-white border-b p-4">
        <h2 className="text-lg font-semibold">
          Chat com {otherUser.name}
        </h2>
        <p className="text-sm text-gray-500">
          {user.role === 'driver' ? 'Passageiro' : 'Motorista'}
        </p>
      </div>

      {/* Área de mensagens */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex ${message.sender._id === user.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender._id === user.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-900'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-75 mt-1 block">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Área de input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </form>
    </div>
  );
} 