"use client";
import React from 'react';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { useRouter } from 'next/navigation';

export default function PagoPendientePage() {
  const router = useRouter();

  return (
    <Box sx={{ bgcolor: '#fbfbfb', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid #ececec', borderRadius: '8px' }}>
          <PendingActionsIcon sx={{ fontSize: 70, color: '#ed6c02', mb: 2 }} />
          
          <Typography variant="h4" sx={{ fontFamily: 'serif', mb: 2, fontWeight: 500 }}>
            Pago Pendiente
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Tu pago está siendo verificado por la pasarela de pagos. Te notificaremos vía correo electrónico en cuanto el estado se actualice.
          </Typography>

          <Button 
            variant="contained" 
            onClick={() => router.push('/')}
            sx={{ 
              bgcolor: '#002855', py: 1.5, px: 4, borderRadius: 0, fontWeight: 700,
              letterSpacing: 2, '&:hover': { bgcolor: '#001E42' } 
            }}
          >
            IR AL INICIO
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}