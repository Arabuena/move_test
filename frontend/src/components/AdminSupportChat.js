import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function AdminSupportChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  // Carregar conversas de suporte
  const loadConversations = async () => {
    try {
      const response = await api.get('/messages/support/conversations');
      setConversations(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
      setError('Erro ao carregar conversas');
      setLoading(false);
    }
  };

  // Carregar mensagens de um usuário específico
  const loadMessages = async (userId) => {
    try {
      const response = await api.get(`/messages/support/user/${userId}`);
      setMessages(response.data);
      setSelectedUser(userId);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError('Erro ao carregar mensagens');
    }
  };

  useEffect(() => {
    loadConversations();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser);
      const interval = setInterval(() => loadMessages(selectedUser), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedUser]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      const response = await api.post('/messages/support/reply', {
        userId: selectedUser,
        content: newMessage.trim()
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem');
    }
  };

  // Função para formatar a data
  const formatLastMessageTime = (date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffHours = Math.abs(now - messageDate) / 36e5;

    if (diffHours < 24) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return messageDate.toLocaleDateString();
  };

  return (
    <div className="flex h-[calc(100vh-200px)] bg-white rounded-lg shadow-lg">
      {/* Lista de conversas */}
      <div className="w-1/3 border-r">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Conversas de Suporte</h2>
        </div>
        <div className="overflow-y-auto h-full">
          {conversations.map((conv) => (
            <button
              key={conv.userId}
              onClick={() => setSelectedUser(conv.userId)}
              className={`w-full p-4 text-left hover:bg-gray-50 border-b relative ${
                selectedUser === conv.userId ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium flex items-center">
                    {conv.userName}
                    <span className="ml-2 text-xs px-2 py-1 bg-gray-200 rounded-full">
                      {conv.userRole === 'driver' ? 'Motorista' : 'Passageiro'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 truncate mt-1">
                    {conv.lastMessage}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  {formatLastMessageTime(conv.lastMessageAt)}
                </div>
              </div>
              {conv.unreadCount > 0 && (
                <span className="absolute top-4 right-4 bg-blue-500 text-white text-xs rounded-full px-2 py-1">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Área de chat */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <div className="p-4 border-b bg-gray-50">
              <div className="font-medium">
                {conversations.find(c => c.userId === selectedUser)?.userName}
              </div>
              <div className="text-sm text-gray-500">
                {conversations.find(c => c.userId === selectedUser)?.userRole === 'driver' 
                  ? 'Motorista' 
                  : 'Passageiro'}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className={`flex ${
                    message.sender._id === user.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender._id === user.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {message.sender.name}
                    </p>
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-75 mt-1 block">
                      {formatLastMessageTime(message.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
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
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Selecione uma conversa para começar
          </div>
        )}
      </div>
    </div>
  );
} 