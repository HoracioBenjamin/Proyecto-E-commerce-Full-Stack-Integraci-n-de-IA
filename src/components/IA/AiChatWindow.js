"use client";
import React, { useEffect, useRef, useState } from 'react'; // 1. Importamos useState
import { Paper, Box, Typography, InputBase, IconButton, Collapse, CircularProgress, keyframes } from '@mui/material'; // 2. Importamos keyframes para la animación
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ReactMarkdown from 'react-markdown';

// 3. Definimos una animación de "pulso" suave para el texto de carga usando CSS-in-JS de MUI
const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 1; }
  100% { opacity: 0.6; }
`;

export default function AiChatWindow({
  isOpen,
  onClose,
  messages,
  inputMessage,
  onInputChange, 
  onSendMessage,
  isLoading
}) {
  const chatScrollRef = useRef(null);

  // 4. LÓGICA PARA EL TEXTO DINÁMICO DE CARGA
  const loadingPhrases = [
    "El asistente está pensando...",
    "Analizando tu consulta...",
    "Buscando en el catálogo...",
    "Encontrando similitudes...",
    "Casi listo...",
    "Formateando respuesta...",
    "Enviando respuesta..."
  ];

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  useEffect(() => {
    let intervalId;

    if (isLoading) {
      // Reiniciamos al primer texto cada vez que empieza a cargar
      setCurrentPhraseIndex(0); 
      
      // Creamos un intervalo que cambia el texto cada 2.5 segundos
      intervalId = setInterval(() => {
        setCurrentPhraseIndex((prevIndex) => 
          (prevIndex + 1) % loadingPhrases.length
        );
      }, 2500); // <-- Tiempo en milisegundos entre cambios de texto
    }

    // LIMPIEZA: Es vital limpiar el intervalo cuando deja de cargar o se desmonta el componente
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading, loadingPhrases.length]);


  // Mantenemos el auto-scroll
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  return (
    <Collapse in={isOpen} timeout="auto" unmountOnExit>
      <Paper
        elevation={6}
        sx={{
          position: 'fixed',
          bottom: { xs: 90, sm: 100 },
          right: { xs: 20, sm: 30 },
          width: { xs: 'calc(100vw - 40px)', sm: 380 },
          height: 500,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          overflow: 'hidden',
          zIndex: 9999,
          bgcolor: '#f8fafc',
          border: '1px solid #e2e8f0'
        }}
      >
        {/* Cabecera (Sin Cambios) */}
        <Box sx={{ bgcolor: 'black', color: 'white', p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <AutoAwesomeIcon sx={{ color: '#009EE3', fontSize: 20 }} />
            <Typography sx={{ fontWeight: 600, fontSize: '15px' }}>
              Asistente de Estilo AI
            </Typography>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ color: 'white', opacity: 0.7, '&:hover': { opacity: 1 } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Área de Mensajes */}
        <Box
          ref={chatScrollRef}
          sx={{
            flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2,
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-track': { background: 'transparent' },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: '10px' }
          }}
        >
          {messages.map((msg) => (
            <Box key={msg.id} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <Box
                sx={{
                  maxWidth: '80%', p: 1.5, borderRadius: '12px',
                  bgcolor: msg.sender === 'user' ? '#009EE3' : 'white',
                  color: msg.sender === 'user' ? 'white' : 'text.primary',
                  border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                  borderTopRightRadius: msg.sender === 'user' ? 0 : '12px',
                  borderTopLeftRadius: msg.sender === 'bot' ? 0 : '12px',
                  fontSize: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  
                  '& img': { maxWidth: '100%', height: 'auto', borderRadius: '8px', display: 'block', margin: '8px 0' },
                  '& p': { margin: 0, marginBottom: '8px' },
                  '& p:last-child': { marginBottom: 0 },
                  '& h3': { margin: '0 0 8px 0', fontSize: '16px' }
                }}
              >
                {msg.sender === 'bot' ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </Box>
            </Box>
          ))}
          
          {/* 5. SECCIÓN DE CARGA DINÁMICA ACTUALIZADA */}
          {isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Box
                sx={{
                  maxWidth: '80%', p: 1.5, borderRadius: '12px',
                  bgcolor: 'white', color: 'text.secondary',
                  border: '1px solid #e2e8f0',
                  borderTopLeftRadius: 0,
                  fontSize: '14px', display: 'flex', alignItems: 'center', gap: 1.5,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                <CircularProgress size={16} sx={{ color: '#009EE3' }} />
                
                {/* Aplicamos la animación de pulso y mostramos el texto actual */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontStyle: 'italic',
                    animation: `${pulse} 1.5s ease-in-out infinite`, // <-- Aplicando animación
                  }}
                >
                  {loadingPhrases[currentPhraseIndex]}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

       {/* Input (Sin Cambios) */}
        <Box component="form" onSubmit={onSendMessage} sx={{ p: 1.5, bgcolor: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 1 }}>
          <InputBase
            placeholder="Pregúntame sobre nuestro catálogo..."
            value={inputMessage}
            onChange={onInputChange}
            disabled={isLoading}
            sx={{ flex: 1, bgcolor: '#f1f5f9', borderRadius: '24px', px: 2, py: 0.5, fontSize: '14px' }}
          />
          <IconButton type="submit" disabled={!inputMessage.trim() || isLoading} sx={{ bgcolor: inputMessage.trim() && !isLoading ? '#009EE3' : '#e2e8f0', color: 'white' }}>
            <SendIcon fontSize="small" sx={{ ml: 0.5 }} />
          </IconButton>
        </Box>
      </Paper>
    </Collapse>
  );
}