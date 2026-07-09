"use client";
import { Box, Typography, Container } from '@mui/material';

export default function AboutUsSection() {
  return (
    <Box
      sx={{
        backgroundImage: 'url("/images/FondoCategoryGrid.jpg")', 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed', 
        py: { xs: 8, md: 12 }, // Un poco más de aire para el contenido de texto
        marginTop: 8
      }}
    >
      <Container maxWidth="md" sx={{ position: 'relative' }}>
        
        {/* PLACA "LIQUID GLASS" */}
        <Box
          sx={{
            p: { xs: 4, md: 8 },
            borderRadius: '40px',
            backgroundColor: 'rgba(11, 12, 65, 0.4)', 
            backdropFilter: 'blur(20px)', 
            webkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.1)',
            textAlign: 'center'
          }}
        >
          <Typography 
            variant="h2" 
            sx={{ 
              fontFamily: 'arial', 
              mb: 4, 
              fontWeight: 300,
              letterSpacing: '0.15em', 
              textTransform: 'uppercase',
              fontSize: { xs: '2rem', md: '3rem' }, 
              color: '#ffffff'
            }}
          >
            Sobre Mí
          </Typography>

          <Typography 
            variant="body1" 
            sx={{ 
              fontFamily: 'arial', 
              lineHeight: 1.8, 
              color: '#ffffff',
              fontSize: { xs: '0.5rem', md: '1.2rem' },
              maxWidth: '800px',
              mx: 'auto'
            }}
          >
              Esta plataforma web fue diseñada y programada completamente desde cero (End-to-End) con el objetivo de consolidar y demostrar mis capacidades como Desarrollador Full-Stack y mi especialización en la integración de Inteligencia Artificial aplicada a negocios.
              De forma 100% autónoma y sin recurrir a plantillas, construí la arquitectura completa del Frontend y Backend, la gestión de bases de datos relacionales y la integración de pasarelas de pago y logística. Actualmente, el proyecto destaca por la implementación de dos módulos avanzados de IA (en desarrollo activo)
        </Typography>

        </Box>
      </Container>
    </Box>
  );
}