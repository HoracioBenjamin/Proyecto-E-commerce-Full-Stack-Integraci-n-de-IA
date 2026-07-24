"use client";
import React, { useState } from 'react';
import AiChatButton from './AiChatButton';
import AiChatWindow from './AiChatWindow';

export default function AiAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, sender: 'bot', text: '¡Hola! Soy tu asistente personal RAG. ¿Buscas algún estilo en particular hoy?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

const toggleChat = () => {
    console.log("1. ¡La función toggleChat se ejecutó!");
    console.log("2. El estado actual de isOpen antes del clic es:", isOpen);
    setIsOpen(!isOpen);
  };
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    // Añadir mensaje del usuario
    const userMsg = { id: Date.now(), sender: 'user', text: userText };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
// Llamada real a Gemini con Memoria
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userText,
          history: messages.slice(-6) // <-- 🎯 AQUÍ ENVIAMOS EL HISTORIAL (Últimos 6 mensajes)
        }),
      });
      const data = await res.json();
      const botResponseText = data.reply || 'No pude procesar tu consulta.';

      const botMsg = { id: Date.now() + 1, sender: 'bot', text: botResponseText };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error("Error al comunicarse con Gemini:", error);
      const errorMsg = { id: Date.now() + 1, sender: 'bot', text: 'Hubo un error de conexión con la IA. Por favor, verifica tu API Key o intenta de nuevo.' };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
    
  };

  return (
    <>
      <AiChatWindow
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        messages={messages}
        inputMessage={inputMessage}
        // Pasamos el evento (e) y extraemos el texto para guardarlo en el estado
        onInputChange={(e) => setInputMessage(e.target.value)} 
        // Usamos el nombre correcto que espera la ventana para enviar
        onSendMessage={handleSendMessage} 
        isLoading={isLoading}
      />
<AiChatButton
        isOpen={isOpen}
        onToggle={toggleChat}  
      />
    </>
  );
}