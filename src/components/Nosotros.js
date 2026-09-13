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
            Sobre WEARSHOP
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
              Somos una marca urbana de zapatillas y ropa buscando siempre los mejores productos y las tendencias. En shoesDuoc nunca faltara tu talla, siempre tendremos stock para la tuya!
              compra y recomiendanos
        </Typography>

        </Box>
      </Container>
    </Box>
  );
}