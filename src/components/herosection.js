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
        backgroundColor: '#002855', // Fondo navy Vivo de seguridad mientras carga
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
          backgroundColor: 'rgba(0, 40, 85, 0.55)', 
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
            fontWeight: 800, 
            fontSize: { xs: '2.6rem', md: '4.5rem' },
            mb: 2,
            color: '#fff',
            letterSpacing: '0.02em',
            textShadow: '0px 4px 20px rgba(0,0,0,0.5)'
          }}
        >
          WearShop
        </Typography>
        
        <Typography 
          variant="overline" 
          sx={{ 
            letterSpacing: '0.5em', 
            color: '#FFB800',
            fontWeight: 700
          }}
        >
          Catálogo ShoesDuoc 2026
        </Typography>
      </motion.div>
    </Box>
  );
}