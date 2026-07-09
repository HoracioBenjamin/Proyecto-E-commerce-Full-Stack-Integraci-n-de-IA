"use client";
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <Box 
      component="section"
      sx={{ 
        height: '100vh', 
        width: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000', // Fondo negro de seguridad mientras carga
      }}
    >
      {/* IMAGEN COMO ELEMENTO HIJO ANIMADO */}
      <motion.img
        src="/images/herosection.jpg" // TU RUTA DIRECTA
        initial={{ scale: 1.2, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 10, 
          ease: "easeOut",
          opacity: { duration: 1.5 } // El desvanecimiento es más rápido que el zoom
        }}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover', // Mantiene la proporción como background-size: cover
          zIndex: 0
        }}
      />

      {/* OVERLAY OSCURO (Para asegurar que el texto se vea siempre) */}
      <Box 
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.3)', 
          zIndex: 1
        }}
      />

      {/* CONTENIDO DEL TÍTULO */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
        style={{ zIndex: 2, position: 'relative' }}
      >
        <Typography 
          variant="h1" 
          sx={{ 
            fontFamily: 'serif', 
            fontWeight: 300, 
            fontSize: { xs: '3rem', md: '5rem' },
            fontStyle: 'italic',
            mb: 2,
            color: '#fff',
            textShadow: '0px 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          L'Ancora di Horacio
        </Typography>
        
        <Typography 
          variant="overline" 
          sx={{ 
            letterSpacing: '0.5em', 
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 500
          }}
        >
          Colección Primavera Verano 2026
        </Typography>
      </motion.div>
    </Box>
  );
}