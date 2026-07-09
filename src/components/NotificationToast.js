"use client";
import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

export default function ToastNotification({ message, visible, onClose }) {
  
  // Temporizador para cerrar automáticamente
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 3500); // Se cierra en 3.5 segundos
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} // Ease de alta gama
          style={{
            position: 'fixed',
            bottom: '30px',
            left: '50%',
            translateX: '-50%',
            zIndex: 2000, // Por encima de todo
            pointerEvents: 'none' // No interfiere con clics
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 3,
              py: 1.8,
              borderRadius: '50px', // Look "Liquid"
              
              // --- ESTILO LIQUID GLASS ---
              bgcolor: 'rgba(255, 60, 60, 0.4)', // Fondo muy translúcido
              backdropFilter: 'blur(15px) saturate(180%)', // Desenfoque y saturación
              WebkitBackdropFilter: 'blur(15px) saturate(180%)', // Soporte Safari
              border: '1px solid rgba(255, 255, 255, 0.3)', // Borde sutil
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.08)', // Sombra suave
              color: '#000', // Texto negro para contraste
              // ----------------------------
            }}
          >
            <ErrorIcon sx={{ fontSize: '1.2rem', color: '#000' }} />
            <Typography 
              variant="body2" 
              sx={{ 
                fontFamily: 'serif', 
                fontWeight: 500, 
                letterSpacing: '1px', 
                textTransform: 'uppercase',
                whiteSpace: 'nowrap'
              }}
            >
              {message}
            </Typography>
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}