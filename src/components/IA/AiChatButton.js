"use client";
import React from 'react';
import { Box, Fab } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CloseIcon from '@mui/icons-material/Close';

export default function AiChatButton({ isOpen, onToggle }) {
  return (
    <Box sx={{ position: 'fixed', bottom: 30, right: 30, zIndex: 10000 }}>
      <Fab
        color="primary"
        aria-label="Abrir Asistente AI"
        onClick={() => {
          console.log("0. ¡Me hicieron clic en el FAB!");
          if (onToggle) {
            onToggle(); // Si la función existe, la ejecuta
          } else {
            console.error("ERROR GRAVE: La propiedad 'onToggle' está vacía o undefined.");
          }
        }}
        sx={{
          bgcolor: '#002855',
          color: 'white',
          width: 60,
          height: 60,
          border: '2px solid #FFB800',
          '&:hover': { bgcolor: '#001E42' },
          '@keyframes pulse': {
            '0%': { boxShadow: '0 0 0 0 rgba(0, 158, 227, 0.7)' },
            '70%': { boxShadow: '0 0 0 15px rgba(0, 158, 227, 0)' },
            '100%': { boxShadow: '0 0 0 0 rgba(0, 158, 227, 0)' }
          },
          animation: !isOpen ? 'pulse 2s infinite' : 'none',
          transition: 'transform 0.3s ease',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)',
        }}
      >
        {isOpen ? <CloseIcon /> : <AutoAwesomeIcon />}
      </Fab>
    </Box>
  );
}