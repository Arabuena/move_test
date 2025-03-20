import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';

export default function ChatWithDriver({ ride }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const receiverId = user.role === 'user' ? ride.driver._id : ride.passenger._id;
  const { notifyNewMessage } = useMessages();
  const previousMessagesRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const response = await api.get(`/messages/ride/${ride._id}`);
      setMessages(response.data);
      
      // Verifica se há mensagens novas apenas se for o destinatário
      const newMessages = response.data.filter(msg => 
        !previousMessagesRef.current.find(prevMsg => prevMsg._id === msg._id) &&
        msg.receiver._id === user.id && // Apenas mensagens onde sou o destinatário
        msg.sender._id !== user.id && // E não sou o remetente
        !msg.read
      );

      if (newMessages.length > 0) {
        notifyNewMessage();
      }

      previousMessagesRef.current = response.data;
      setLoading(false);
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
      setError('Erro ao carregar mensagens');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ride._id) {
      loadMessages();
      const interval = setInterval(loadMessages, 3000);
      return () => clearInterval(interval);
    }
  }, [ride._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await api.post('/messages', {
        rideId: ride._id,
        receiverId,
        content: newMessage.trim()
      });

      setMessages(prevMessages => [...prevMessages, response.data]);
      setNewMessage('');
      
      // Atualiza a referência sem notificar, já que sou o remetente
      previousMessagesRef.current = [...messages, response.data];
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      setError('Erro ao enviar mensagem');
    }
  };

  if (loading) return <div>Carregando...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="flex flex-col h-[500px]">
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
              <p className="text-sm">{message.content}</p>
              <span className="text-xs opacity-75 mt-1 block">
                {new Date(message.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t">
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