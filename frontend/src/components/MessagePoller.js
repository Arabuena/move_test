import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useMessages } from '../contexts/MessageContext';
import api from '../services/api';

export default function MessagePoller() {
  const { user } = useAuth();
  const { notifyNewMessage } = useMessages();

  useEffect(() => {
    if (!user) return;

    const checkNewMessages = async () => {
      try {
        // Log do usuário atual para debug
        console.log('Usuário atual:', {
          id: user.id,
          role: user.role,
          name: user.name
        });

        const response = await api.get('/messages/unread');
        console.log('Resposta completa:', response.data);
        
        // Filtra mensagens onde o usuário é o receptor E NÃO é o remetente
        const unreadMessages = response.data.filter(msg => {
          const receiverId = msg.receiver._id.toString();
          const senderId = msg.sender._id.toString();
          const userId = user.id.toString();
          
          const isReceiver = receiverId === userId;
          const isNotSender = senderId !== userId;

          console.log('Verificando mensagem:', {
            messageId: msg._id,
            content: msg.content,
            receiverId,
            senderId,
            userId,
            isReceiver,
            isNotSender,
            shouldNotify: isReceiver && isNotSender
          });

          // Só notifica se for o receptor E NÃO for o remetente
          return isReceiver && isNotSender;
        });
        
        if (unreadMessages.length > 0) {
          console.log('Mensagens não lidas para notificar:', unreadMessages.length);
          notifyNewMessage();
        } else {
          console.log('Nenhuma mensagem não lida encontrada');
        }
      } catch (error) {
        console.error('Erro ao verificar mensagens:', error);
      }
    };

    // Executa imediatamente e configura o intervalo
    checkNewMessages();
    const interval = setInterval(checkNewMessages, 3000); // Reduzindo para 3 segundos

    return () => clearInterval(interval);
  }, [user, notifyNewMessage]);

  return null;
} 