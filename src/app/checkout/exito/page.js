"use client";
import React, { useEffect } from 'react';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useRouter } from 'next/navigation';
import { useCart } from '../../../components/context/CartContext'; // Ajusta la ruta a tu CartContext si es necesario

export default function PagoExitosoPage() {
  const router = useRouter();
  const { cart, updateQuantity } = useCart(); // O la función que uses para vaciar el carrito

  useEffect(() => {
    // Es una buena práctica limpiar el carrito local aquí 
    // una vez que confirmamos que el pago fue exitoso.
    // Ejemplo: localStorage.removeItem('cart'); o vaciarContexto();
  }, []);

  return (
    <Box sx={{ bgcolor: '#fbfbfb', minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid #ececec', borderRadius: '8px' }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 70, color: '#2e7d32', mb: 2 }} />
          
          <Typography variant="h4" sx={{ fontFamily: 'serif', mb: 2, fontWeight: 500 }}>
            ¡Tu pago fue exitoso!
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Hemos recibido tu orden correctamente. Pronto te enviaremos un correo electrónico con los detalles del envío y tu comprobante.
          </Typography>

          <Button 
            variant="contained" 
            onClick={() => router.push('/')}
            sx={{ 
              bgcolor: '#002855', py: 1.5, px: 4, borderRadius: 0, fontWeight: 700,
              letterSpacing: 2, '&:hover': { bgcolor: '#001E42' } 
            }}
          >
            VOLVER A LA TIENDA
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}