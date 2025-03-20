import React, { createContext, useState, useContext, useEffect } from 'react';

const MessageContext = createContext(null);

export function MessageProvider({ children }) {
  const [unreadMessages, setUnreadMessages] = useState(() => {
    // Recupera o estado salvo no localStorage
    const saved = localStorage.getItem('unreadMessages');
    return saved ? JSON.parse(saved) : false;
  });

  // Salva o estado no localStorage quando mudar
  useEffect(() => {
    localStorage.setItem('unreadMessages', JSON.stringify(unreadMessages));
    console.log('Estado de mensagens não lidas atualizado:', unreadMessages);
  }, [unreadMessages]);

  const markMessagesAsRead = () => {
    console.log('Marcando mensagens como lidas');
    setUnreadMessages(false);
  };

  const notifyNewMessage = () => {
    console.log('Notificando nova mensagem no contexto');
    setUnreadMessages(true);
  };

  const value = {
    unreadMessages,
    markMessagesAsRead,
    notifyNewMessage
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
}

export const useMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessages deve ser usado dentro de um MessageProvider');
  }
  return context;
}; 