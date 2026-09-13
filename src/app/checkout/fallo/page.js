"use client";
import React from 'react';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useRouter } from 'next/navigation';

export default function PagoFallidoPage() {
  const router = useRouter();

  return (
    <Box sx={{ bgcolor: '#fbfbfb', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid #ececec', borderRadius: '8px' }}>
          <ErrorOutlineIcon sx={{ fontSize: 70, color: '#d32f2f', mb: 2 }} />
          
          <Typography variant="h4" sx={{ fontFamily: 'serif', mb: 2, fontWeight: 500 }}>
            Pago Rechazado
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            No pudimos procesar tu pago. Por favor, verifica que tu tarjeta tenga fondos suficientes e intenta realizar la transacción nuevamente.
          </Typography>

          <Button 
            variant="contained" 
            onClick={() => router.push('/checkout')} // Lo mandamos de vuelta al carrito para reintentar
            sx={{ 
              bgcolor: '#002855', py: 1.5, px: 4, borderRadius: 0, fontWeight: 700,
              letterSpacing: 2, '&:hover': { bgcolor: '#001E42' } 
            }}
          >
            REINTENTAR COMPRA
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}